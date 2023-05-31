import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  isAppRoute,
  parseJsonQueryObject,
  validateResponse,
} from '@ts-rest/core';
import type {
  IRouter,
  Request,
  RequestHandler,
  Response,
} from 'express-serve-static-core';
import {
  AppRouteImplementationOrOptions,
  TsRestExpressOptions,
  RecursiveRouterObj,
  TsRestRequestHandler,
  isAppRouteImplementation,
  TsRestRequest,
} from './types';

export const initServer = () => {
  return {
    router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) =>
      args,
  };
};

const recursivelyApplyExpressRouter = ({
  schema,
  router,
  processRoute,
}: {
  schema: AppRouter | AppRoute;
  router: RecursiveRouterObj<any> | AppRouteImplementationOrOptions<AppRoute>;
  processRoute: (
    implementation: AppRouteImplementationOrOptions<AppRoute>,
    schema: AppRoute
  ) => void;
}): void => {
  if (typeof router === 'object' && typeof router?.handler !== 'function') {
    for (const key in router) {
      if (isAppRoute(schema)) {
        throw new Error(`[ts-rest] Expected AppRouter but received AppRoute`);
      }

      recursivelyApplyExpressRouter({
        schema: schema[key],
        router: (router as RecursiveRouterObj<any>)[key],
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
  schema: AppRouteQuery | AppRouteMutation,
  options: TsRestExpressOptions<AppRouter>
) => {
  const paramsResult = checkZodSchema(req.params, schema.pathParams, {
    passThroughExtraKeys: true,
  });

  if (!paramsResult.success) {
    return res.status(400).send(paramsResult.error);
  }

  const headersResult = checkZodSchema(req.headers, schema.headers, {
    passThroughExtraKeys: true,
  });

  if (!headersResult.success) {
    return res.status(400).send(headersResult.error);
  }

  const query = options.jsonQuery
    ? parseJsonQueryObject(req.query as Record<string, string>)
    : req.query;

  const queryResult = checkZodSchema(query, schema.query);

  if (!queryResult.success) {
    return res.status(400).send(queryResult.error);
  }

  const bodyResult = checkZodSchema(
    req.body,
    'body' in schema ? schema.body : null
  );

  if (!bodyResult.success) {
    return res.status(400).send(bodyResult.error);
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
    const validationResults = validateRequest(req, res, schema, options);

    // validation failed, return response
    if (!('paramsResult' in validationResults)) {
      return validationResults;
    }

    try {
      const result = await handler({
        params: validationResults.paramsResult.data as any,
        body: validationResults.bodyResult.data,
        query: validationResults.queryResult.data,
        headers: validationResults.headersResult.data as any,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        files: req.files,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        file: req.file,
        req: req as TsRestRequest<any>,
        res: res,
      });

      const statusCode = Number(result.status);

      if (options.responseValidation) {
        const response = validateResponse({
          responseType: schema.responses[statusCode],
          response: {
            status: statusCode,
            body: result.body,
          },
        });

        return res.status(statusCode).json(response.body);
      }

      return res.status(statusCode).json(result.body);
    } catch (e) {
      return next(e);
    }
  };

  const handlers: TsRestRequestHandler<AppRoute>[] = [
    (req, res, next) => {
      req.tsRestRoute = schema;
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

export const createExpressEndpoints = <TRouter extends AppRouter>(
  schema: TRouter,
  router: RecursiveRouterObj<TRouter>,
  app: IRouter,
  options: TsRestExpressOptions<TRouter> = {
    logInitialization: true,
    jsonQuery: false,
    responseValidation: false,
  }
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
};
