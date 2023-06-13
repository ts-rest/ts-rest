import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  isAppRoute,
  isAppRouteOtherResponse,
  parseJsonQueryObject,
  ResponseValidationError as ResponseValidationErrorCore,
  validateResponse,
} from '@ts-rest/core';
import { Router, withContent, withParams } from 'itty-router';
import { TsRestRequest } from './request';
import { TsRestResponse } from './response';
import {
  AppRouteImplementation,
  RecursiveRouterObj,
  RequestValidationError,
  ResponseValidationError,
  ServerlessHandlerOptions,
} from './types';
import { createCors } from './cors';
import { TsRestHttpError } from './http-error';

const recursivelyProcessContract = ({
  schema,
  router,
  processRoute,
}: {
  schema: AppRouter | AppRoute;
  router: RecursiveRouterObj<any, any> | AppRouteImplementation<any, any>;
  processRoute: (
    implementation: AppRouteImplementation<AppRoute, any>,
    schema: AppRoute
  ) => void;
}): void => {
  if (typeof router === 'object') {
    for (const key in router) {
      if (isAppRoute(schema)) {
        throw new Error(`[ts-rest] Expected AppRouter but received AppRoute`);
      }

      recursivelyProcessContract({
        schema: schema[key],
        router: router[key],
        processRoute,
      });
    }
  } else if (typeof router === 'function') {
    if (!isAppRoute(schema)) {
      throw new Error(`[ts-rest] Expected AppRoute but received AppRouter`);
    }

    processRoute(router as AppRouteImplementation<AppRoute, any>, schema);
  }
};

const validateRequest = (
  req: TsRestRequest,
  schema: AppRouteQuery | AppRouteMutation,
  options: ServerlessHandlerOptions
) => {
  const paramsResult = checkZodSchema(req.params, schema.pathParams, {
    passThroughExtraKeys: true,
  });

  const headersResult = checkZodSchema(req.headers, schema.headers, {
    passThroughExtraKeys: true,
  });

  const queryResult = checkZodSchema(
    options.jsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query,
    schema.query
  );

  const bodyResult = checkZodSchema(
    req.content,
    'body' in schema ? schema.body : null
  );

  if (
    !paramsResult.success ||
    !headersResult.success ||
    !queryResult.success ||
    !bodyResult.success
  ) {
    throw new RequestValidationError(
      !paramsResult.success ? paramsResult.error : null,
      !headersResult.success ? headersResult.error : null,
      !queryResult.success ? queryResult.error : null,
      !bodyResult.success ? bodyResult.error : null
    );
  }

  return {
    paramsResult,
    headersResult,
    queryResult,
    bodyResult,
  };
};

export const createServerlessRouter = <TPlatformArgs, T extends AppRouter>(
  routes: T,
  obj: RecursiveRouterObj<T, TPlatformArgs>,
  options: ServerlessHandlerOptions = {}
) => {
  const router = Router<TsRestRequest, [TPlatformArgs]>();

  const { preflightHandler, corsifyResponse } = createCors(options.cors);

  router.options('*', preflightHandler);
  router.all('*', withParams, withContent, async (req) => {
    if (
      !req.content &&
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      req.headers.get('content-type')?.startsWith('text/')
    ) {
      req.content = await req.text();
    }
  });

  recursivelyProcessContract({
    schema: routes,
    router: obj,
    processRoute: (implementation, appRoute) => {
      const routeHandler = async (
        request: TsRestRequest,
        platformArgs: TPlatformArgs
      ) => {
        const validationResults = validateRequest(request, appRoute, options);

        const result = await implementation({
          params: validationResults.paramsResult.data as any,
          body: validationResults.bodyResult.data as any,
          query: validationResults.queryResult.data as any,
          headers: validationResults.headersResult.data as any,
          request,
          appRoute,
          ...platformArgs,
        });

        const statusCode = Number(result.status);
        const responseType = appRoute.responses[statusCode];

        let validatedResponseBody = result.body;

        if (options.responseValidation) {
          try {
            const response = validateResponse({
              responseType,
              response: {
                status: statusCode,
                body: result.body,
              },
            });

            validatedResponseBody = response.body;
          } catch (e) {
            if (e instanceof ResponseValidationErrorCore) {
              throw new ResponseValidationError(appRoute, e.cause);
            }

            throw e;
          }
        }

        if (isAppRouteOtherResponse(responseType)) {
          return new TsRestResponse({
            statusCode: statusCode,
            body: validatedResponseBody,
            headers: {
              ...result.headers,
              'content-type':
                validatedResponseBody instanceof Blob
                  ? validatedResponseBody.type || responseType.contentType
                  : responseType.contentType,
            },
          });
        }

        return new TsRestResponse({
          statusCode: statusCode,
          body: JSON.stringify(validatedResponseBody),
          headers: {
            ...result.headers,
            'content-type': 'application/json',
          },
        });
      };

      const corsifiedRouteHandler = async (
        request: TsRestRequest,
        platformArgs: TPlatformArgs
      ) => {
        const response = await routeHandler(request, platformArgs);
        return corsifyResponse(request, response);
      };

      const routerMethod = appRoute.method.toLowerCase();
      router[routerMethod](appRoute.path, corsifiedRouteHandler);
    },
  });

  router.all('*', () => {
    return new TsRestResponse({
      statusCode: 404,
      body: JSON.stringify({
        message: 'Not found',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
  });

  return router;
};

export const serverlessErrorHandler = async (
  err: any,
  request: TsRestRequest,
  options: ServerlessHandlerOptions = {}
): Promise<TsRestResponse> => {
  const { corsifyResponse } = createCors(options.cors);

  if (options?.errorHandler) {
    const maybeResponse = await options.errorHandler(err, request);

    if (maybeResponse) {
      return corsifyResponse(request, new TsRestResponse(maybeResponse));
    }
  }

  if (err instanceof TsRestHttpError) {
    const isJson = err.contentType.startsWith('application/json');

    return corsifyResponse(
      request,
      new TsRestResponse({
        statusCode: err.statusCode,
        body: isJson ? JSON.stringify(err.body) : err.body,
        headers: {
          'content-type': err.contentType,
        },
      })
    );
  }

  return serverlessErrorHandler(
    new TsRestHttpError(500, { message: 'Server Error' }),
    request,
    options
  );
};
