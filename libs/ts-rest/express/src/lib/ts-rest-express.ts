import {
  ApiRouteServerResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  GetFieldType,
  isAppRoute,
  LowercaseKeys,
  parseJsonQueryObject,
  PathParamsWithCustomValidators,
  validateResponse,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import type {
  IRouter,
  Request,
  RequestHandler,
  Response,
  NextFunction,
} from 'express-serve-static-core';

export function getValue<
  TData,
  TPath extends string,
  TDefault = GetFieldType<TData, TPath>
>(
  data: TData,
  path: TPath,
  defaultValue?: TDefault
): GetFieldType<TData, TPath> | TDefault {
  const value = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .reduce<GetFieldType<TData, TPath>>(
      (value, key) => (value as any)?.[key],
      data as any
    );

  return value !== undefined ? value : (defaultValue as TDefault);
}

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> & Request['headers'];
      req: TsRestRequest<T, any>;
      res: Response;
    },
    never
  >
) => Promise<ApiRouteServerResponse<T['responses']>>;

type WithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

type AppRouteMutationImplementation<T extends AppRouteMutation> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      body: WithoutFileIfMultiPart<T>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> & Request['headers'];
      files: unknown;
      file: unknown;
      req: TsRestRequest<T, any>;
      res: Response;
    },
    never
  >
) => Promise<ApiRouteServerResponse<T['responses']>>;

type AppRouteImplementation<T extends AppRoute> = T extends AppRouteMutation
  ? AppRouteMutationImplementation<T>
  : T extends AppRouteQuery
  ? AppRouteQueryImplementation<T>
  : never;

type TsRestRequest<TRoute extends AppRoute, TContext> = Request & {
  tsRest: { schema: TRoute; context?: TContext };
};

export interface TsRestRequestHandler<TRoute extends AppRoute, TContext> {
  (
    req: Request & { tsRest: { schema: TRoute; context?: TContext } },
    res: Response,
    next: NextFunction
  ): void;
}

interface AppRouteOptions<TRoute extends AppRoute, TContext = any> {
  context?:
    | TContext
    | ((props: { req: Request; schema: TRoute }) => Promise<TContext>);
  middleware?: TsRestRequestHandler<TRoute, TContext>[];
  handler: TRoute extends AppRouteQuery
    ? AppRouteQueryImplementation<TRoute>
    : TRoute extends AppRouteMutation
    ? AppRouteMutationImplementation<TRoute>
    : never;
}

type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>
): obj is AppRouteImplementation<TRoute> => {
  return typeof obj === 'function';
};

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey]>
    : never;
};

type Options = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
  middleware?: TsRestRequestHandler<AppRoute, any>[];
};

export const initServer = () => {
  return {
    router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) =>
      args,
  };
};

const recursivelyApplyExpressRouter = (
  router: RecursiveRouterObj<any> | AppRouteImplementationOrOptions<AppRoute>,
  path: string[],
  routeTransformer: (
    route: AppRouteImplementationOrOptions<AppRoute>,
    path: string[]
  ) => void
): void => {
  if (typeof router === 'object' && typeof router?.handler !== 'function') {
    for (const key in router) {
      recursivelyApplyExpressRouter(
        (router as RecursiveRouterObj<any>)[key],
        [...path, key],
        routeTransformer
      );
    }
  } else if (
    typeof router === 'function' ||
    typeof router?.handler === 'function'
  ) {
    routeTransformer(router as AppRouteImplementationOrOptions<AppRoute>, path);
  }
};

const validateRequest = (
  req: Request,
  res: Response,
  schema: AppRouteQuery | AppRouteMutation,
  options: Options
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

  return {
    paramsResult,
    headersResult,
    queryResult,
  };
};

const contextMiddleware = (
  implementationOrOptions: AppRouteImplementationOrOptions<any>,
  schema: AppRoute
): TsRestRequestHandler<any, any> => {
  return (req, res, next) => {
    (async () => {
      let context = undefined;

      if (
        !isAppRouteImplementation(implementationOrOptions) &&
        implementationOrOptions.context
      ) {
        context =
          typeof implementationOrOptions.context === 'function'
            ? await implementationOrOptions.context({ req, schema })
            : implementationOrOptions.context;
      }

      req.tsRest = {
        schema,
        context,
      };

      next();
    })();
  };
};

const transformAppRouteQueryImplementation = (
  implementationOrOptions: AppRouteImplementationOrOptions<AppRouteQuery>,
  schema: AppRouteQuery,
  app: IRouter,
  options: Options
) => {
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
        query: validationResults.queryResult.data,
        headers: validationResults.headersResult.data as any,
        req: req as TsRestRequest<AppRouteQuery, any>,
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

  const handlers: TsRestRequestHandler<AppRouteQuery, any>[] = [
    contextMiddleware(implementationOrOptions, schema),
  ];

  if (options.middleware) {
    handlers.push(...options.middleware);
  }

  if (
    !isAppRouteImplementation(implementationOrOptions) &&
    implementationOrOptions.middleware
  ) {
    handlers.push(...implementationOrOptions.middleware);
  }

  handlers.push(mainReqHandler);

  app.get(schema.path, ...(handlers as RequestHandler[]));
};

const transformAppRouteMutationImplementation = (
  implementationOrOptions: AppRouteImplementationOrOptions<AppRouteMutation>,
  schema: AppRouteMutation,
  app: IRouter,
  options: Options
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);
  }

  const method = schema.method;

  const handler = isAppRouteImplementation(implementationOrOptions)
    ? implementationOrOptions
    : implementationOrOptions.handler;

  const mainReqHandler: RequestHandler = async (req, res, next) => {
    const validationResults = validateRequest(req, res, schema, options);

    // validation failed, return response
    if (!('paramsResult' in validationResults)) {
      return validationResults;
    }

    const bodyResult = checkZodSchema(req.body, schema.body);

    if (!bodyResult.success) {
      return res.status(400).send(bodyResult.error);
    }

    try {
      const result = await handler({
        params: validationResults.paramsResult.data as any,
        body: bodyResult.data,
        query: validationResults.queryResult.data,
        headers: validationResults.headersResult.data as any,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        files: req.files,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        file: req.file,
        req: req as TsRestRequest<AppRouteMutation, any>,
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

  const handlers: TsRestRequestHandler<AppRouteMutation, any>[] = [
    contextMiddleware(implementationOrOptions, schema),
  ];

  if (options.middleware) {
    handlers.push(...options.middleware);
  }

  if (
    !isAppRouteImplementation(implementationOrOptions) &&
    implementationOrOptions.middleware
  ) {
    handlers.push(...implementationOrOptions.middleware);
  }

  handlers.push(mainReqHandler);

  switch (method) {
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

export const createExpressEndpoints = <
  T extends RecursiveRouterObj<TRouter>,
  TRouter extends AppRouter
>(
  schema: TRouter,
  router: T,
  app: IRouter,
  options: Options = {
    logInitialization: true,
    jsonQuery: false,
    responseValidation: false,
  }
) => {
  recursivelyApplyExpressRouter(router, [], (route, path) => {
    const routerViaPath = getValue(schema, path.join('.'));

    if (!routerViaPath) {
      throw new Error(`[ts-rest] No router found for path ${path.join('.')}`);
    }

    if (isAppRoute(routerViaPath)) {
      if (routerViaPath.method === 'GET') {
        transformAppRouteQueryImplementation(
          route as AppRouteImplementationOrOptions<AppRouteQuery>,
          routerViaPath,
          app,
          options
        );
      } else {
        transformAppRouteMutationImplementation(
          route as AppRouteImplementationOrOptions<AppRouteMutation>,
          routerViaPath,
          app,
          options
        );
      }
    } else {
      throw new Error(
        'Could not find schema route implementation for ' + path.join('.')
      );
    }
  });
};
