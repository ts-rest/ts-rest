import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  isAppRoute,
  isAppRouteOtherResponse,
  validateResponse,
} from '@ts-rest/core';
import { Router, withContent, withParams } from 'itty-router';
import { TsRestRequest } from './request';
import { TsRestResponse } from './response';
import {
  AppRouteImplementation,
  RecursiveRouterObj,
  RequestValidationError,
  ServerlessHandlerOptions,
} from './types';

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
  schema: AppRouteQuery | AppRouteMutation
) => {
  const paramsResult = checkZodSchema(req.params, schema.pathParams, {
    passThroughExtraKeys: true,
  });

  const headersResult = checkZodSchema(req.headers, schema.headers, {
    passThroughExtraKeys: true,
  });

  const query = req.query;

  const queryResult = checkZodSchema(query, schema.query);

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
    processRoute: (implementation, schema) => {
      const routeHandler = async (
        request: TsRestRequest,
        platformArgs: TPlatformArgs
      ) => {
        const validationResults = validateRequest(request, schema);

        const result = await implementation({
          params: validationResults.paramsResult.data as any,
          body: validationResults.bodyResult.data as any,
          query: validationResults.queryResult.data as any,
          headers: validationResults.headersResult.data as any,
          request,
          ...platformArgs,
        });

        const statusCode = Number(result.status);
        const responseType = schema.responses[statusCode];

        let validatedResponseBody = result.body;

        if (options.responseValidation) {
          const response = validateResponse({
            responseType,
            response: {
              status: statusCode,
              body: result.body,
            },
          });

          validatedResponseBody = response.body;
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

      switch (schema.method) {
        case 'GET':
          router.get(schema.path, routeHandler);
          break;
        case 'DELETE':
          router.delete(schema.path, routeHandler);
          break;
        case 'POST':
          router.post(schema.path, routeHandler);
          break;
        case 'PUT':
          router.put(schema.path, routeHandler);
          break;
        case 'PATCH':
          router.patch(schema.path, routeHandler);
          break;
      }
    },
  });

  return router;
};

export const serverlessErrorHandler = async (
  err: any,
  request: TsRestRequest,
  options: ServerlessHandlerOptions = {}
) => {
  if (err instanceof RequestValidationError) {
    if (options?.requestValidationErrorHandler) {
      return new TsRestResponse(
        await options.requestValidationErrorHandler(err, request)
      );
    }

    return new TsRestResponse({
      statusCode: 400,
      body: JSON.stringify({
        pathParameterErrors: err.pathParams,
        headerErrors: err.headers,
        queryParameterErrors: err.query,
        bodyErrors: err.body,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  if (options?.errorHandler) {
    return new TsRestResponse(await options.errorHandler(err, request));
  }

  return new TsRestResponse({
    statusCode: 500,
    body: JSON.stringify({ message: 'Server Error' }),
    headers: {
      'content-type': 'application/json',
    },
  });
};
