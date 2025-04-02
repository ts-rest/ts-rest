import {
  AppRoute,
  AppRouter,
  checkZodSchema,
  HTTPStatusCode,
  isAppRoute,
  isAppRouteNoBody,
  isAppRouteOtherResponse,
  parseJsonQueryObject,
  TsRestResponseError,
  validateResponse,
} from '@ts-rest/core';
import type {
  IRouter,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import {
  AppRouteImplementationOrOptions,
  TsRestExpressOptions,
  RouterImplementation,
  TsRestRequestHandler,
  isAppRouteImplementation,
} from './types';
import { RequestValidationError } from './request-validation-error';
import { Stream } from 'stream';

export const initServer = () => {
  return {
    router: <
      T extends AppRouter = AppRouter,
      TRouter extends RouterImplementation<T> = RouterImplementation<T>,
    >(
      contract: T,
      router: TRouter,
    ) => router,
    route: <
      T extends AppRoute,
      TRoute extends
        AppRouteImplementationOrOptions<T> = AppRouteImplementationOrOptions<T>,
    >(
      contract: T,
      route: TRoute,
    ) => route,
  };
};

const recursivelyApplyExpressRouter = ({
  schema,
  router,
  processRoute,
}: {
  schema: AppRouter | AppRoute;
  router: RouterImplementation<any> | AppRouteImplementationOrOptions<any>;
  processRoute: (
    implementation: AppRouteImplementationOrOptions<AppRoute>,
    schema: AppRoute,
  ) => void;
}): void => {
  if (typeof router === 'object' && typeof router?.handler !== 'function') {
    for (const key in router) {
      if (isAppRoute(schema)) {
        throw new Error(`[ts-rest] Expected AppRouter but received AppRoute`);
      }

      recursivelyApplyExpressRouter({
        schema: schema[key],
        router: (router as RouterImplementation<any>)[key],
        processRoute,
      });
    }
  } else if (
    typeof router === 'function' ||
    typeof router?.handler === 'function'
  ) {
    if (!isAppRoute(schema)) {
      throw new Error(`[ts-rest] Expected AppRoute but received AppRouter`);
    }

    processRoute(router as AppRouteImplementationOrOptions<AppRoute>, schema);
  }
};

const validateRequest = (
  req: Request,
  res: Response,
  schema: AppRoute,
  options: TsRestExpressOptions<AppRouter>,
) => {
  const paramsResult = checkZodSchema(req.params, schema.pathParams, {
    passThroughExtraKeys: true,
  });

  const headersResult = checkZodSchema(req.headers, schema.headers, {
    passThroughExtraKeys: true,
  });

  const query = options.jsonQuery
    ? parseJsonQueryObject(req.query as Record<string, string>)
    : req.query;

  const queryResult = checkZodSchema(query, schema.query);

  const bodyResult = checkZodSchema(
    req.body,
    'body' in schema ? schema.body : null,
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
      !bodyResult.success ? bodyResult.error : null,
    );
  }

  return {
    paramsResult,
    headersResult,
    queryResult,
    bodyResult,
  };
};

const initializeExpressRoute = ({
  implementationOrOptions,
  schema,
  app,
  options,
}: {
  implementationOrOptions: AppRouteImplementationOrOptions<AppRoute>;
  schema: AppRoute;
  app: IRouter;
  options: TsRestExpressOptions<any>;
}) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);
  }

  const handler = isAppRouteImplementation(implementationOrOptions)
    ? implementationOrOptions
    : implementationOrOptions.handler;

  const mainReqHandler: RequestHandler = async (req, res, next) => {
    try {
      const validationResults = validateRequest(req, res, schema, options);

      let result: { status: HTTPStatusCode; body: any };
      try {
        result = await handler({
          params: validationResults.paramsResult.data as any,
          body: validationResults.bodyResult.data as any,
          query: validationResults.queryResult.data,
          headers: validationResults.headersResult.data as any,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          files: req.files,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          file: req.file,
          req: req as any,
          res: res,
        });
      } catch (e) {
        if (e instanceof TsRestResponseError) {
          result = {
            status: e.statusCode,
            body: e.body,
          };
        } else {
          throw e;
        }
      }

      const statusCode = Number(result.status);

      if (result.body instanceof Stream) {
        result.body.pipe(res.status(result.status));
        return;
      }

      let validatedResponseBody = result.body;

      if (options.responseValidation) {
        const response = validateResponse({
          appRoute: schema,
          response: {
            status: statusCode,
            body: result.body,
          },
        });

        validatedResponseBody = response.body;
      }

      const responseType = schema.responses[statusCode];

      if (isAppRouteNoBody(responseType)) {
        res.status(statusCode).end();
        return;
      }

      if (isAppRouteOtherResponse(responseType)) {
        res.setHeader('content-type', responseType.contentType);
        res.status(statusCode).send(validatedResponseBody);
        return;
      }

      res.status(statusCode).json(validatedResponseBody);
      return;
    } catch (e) {
      next(e);
      return;
    }
  };

  const handlers: TsRestRequestHandler<AppRoute>[] = [
    (req, res, next) => {
      req.tsRestRoute = schema as any;
      next();
    },
  ];

  if (options.globalMiddleware) {
    handlers.push(...options.globalMiddleware);
  }

  if (
    !isAppRouteImplementation(implementationOrOptions) &&
    implementationOrOptions.middleware
  ) {
    handlers.push(...implementationOrOptions.middleware);
  }

  handlers.push(mainReqHandler);

  switch (schema.method) {
    case 'GET':
      app.get(schema.path, ...(handlers as RequestHandler[]));
      break;
    case 'DELETE':
      app.delete(schema.path, ...(handlers as RequestHandler[]));
      break;
    case 'POST':
      app.post(schema.path, ...(handlers as RequestHandler[]));
      break;
    case 'PUT':
      app.put(schema.path, ...(handlers as RequestHandler[]));
      break;
    case 'PATCH':
      app.patch(schema.path, ...(handlers as RequestHandler[]));
      break;
  }
};

const requestValidationErrorHandler = (
  handler: TsRestExpressOptions<any>['requestValidationErrorHandler'] = 'default',
) => {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof RequestValidationError) {
      // old-style error handling, kept for backwards compatibility
      if (handler === 'default') {
        if (err.pathParams) {
          res.status(400).json(err.pathParams);
          return;
        }
        if (err.headers) {
          res.status(400).json(err.headers);
          return;
        }
        if (err.query) {
          res.status(400).json(err.query);
          return;
        }
        if (err.body) {
          res.status(400).json(err.body);
          return;
        }
      } else if (handler === 'combined') {
        res.status(400).json({
          pathParameterErrors: err.pathParams,
          headerErrors: err.headers,
          queryParameterErrors: err.query,
          bodyErrors: err.body,
        });
        return;
      } else if (typeof handler === 'function') {
        // Call the custom handler but don't return its result
        handler(err, req as any, res, next);
        return;
      }
    }

    next(err);
  };
};

export const createExpressEndpoints = <TRouter extends AppRouter>(
  schema: TRouter,
  router: RouterImplementation<TRouter>,
  app: IRouter,
  options: TsRestExpressOptions<TRouter> = {
    logInitialization: true,
    jsonQuery: false,
    responseValidation: false,
    requestValidationErrorHandler: 'default',
  },
) => {
  recursivelyApplyExpressRouter({
    schema,
    router,
    processRoute: (implementation, innerSchema) => {
      initializeExpressRoute({
        implementationOrOptions:
          implementation as AppRouteImplementationOrOptions<AppRoute>,
        schema: innerSchema,
        app,
        options,
      });
    },
  });

  app.use(requestValidationErrorHandler(options.requestValidationErrorHandler));
};
