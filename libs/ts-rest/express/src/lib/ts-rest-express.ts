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
  Express,
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

export type TsRestRequest<
  TRoute extends AppRoute,
  TContext
> = Express['request'] & {
  tsRest: { route: TRoute; context: TContext };
};

export interface TsRestRequestHandler<
  TRoute extends AppRoute,
  TContext = never
> {
  (
    req: TsRestRequest<TRoute, TContext>,
    res: Response,
    next: NextFunction
  ): void;
}

interface AppRouteOptions<TRoute extends AppRoute, TContext = never> {
  middleware?: TsRestRequestHandler<TRoute, TContext>[];
  handler: TRoute extends AppRouteQuery
    ? AppRouteQueryImplementation<TRoute>
    : TRoute extends AppRouteMutation
    ? AppRouteMutationImplementation<TRoute>
    : never;
}

type AppRouteImplementationOrOptions<
  TRoute extends AppRoute,
  TContext = never
> = AppRouteOptions<TRoute, TContext> | AppRouteImplementation<TRoute>;

const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>
): obj is AppRouteImplementation<TRoute> => {
  return typeof obj === 'function';
};

type RecursiveRouterObj<T extends AppRouter, TContext = never> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey], TContext>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey], TContext>
    : never;
};

const RouterOptions = Symbol('RouterOptions');

type CompleteRouterObj<
  T extends AppRouter,
  TContext = never
> = RecursiveRouterObj<T, TContext> & {
  [RouterOptions]?: {
    contextFunction: ContextFunction<T, TContext>;
  };
};

type Options<TContext = any> = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
  middleware?: TsRestRequestHandler<AppRoute, TContext>[];
};

export type FlattenAppRouter<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? T[TKey]
    : T[TKey] extends AppRouter
    ? FlattenAppRouter<T[TKey]>
    : never;
}[keyof T];

export type ContextFunction<T extends AppRouter, TContext> = ({
  req,
  route,
}: {
  req: Request;
  route: FlattenAppRouter<T>;
}) => TContext | Promise<TContext>;

export const initServer = () => {
  return {
    context: <T extends AppRouter, TContext>(
      router: T,
      contextFunction: ContextFunction<T, TContext>
    ) => {
      return {
        router: (args: RecursiveRouterObj<T, TContext>) => ({
          ...args,
          [RouterOptions]: {
            contextFunction,
          },
        }),
      };
    },
    router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) =>
      args,
  };
};

const recursivelyApplyExpressRouter = ({
  router,
  path,
  routeTransformer,
}: {
  router:
    | CompleteRouterObj<any, any>
    | AppRouteImplementationOrOptions<AppRoute>;
  path: string[];
  routeTransformer: (
    route: AppRouteImplementationOrOptions<AppRoute>,
    path: string[]
  ) => void;
}): void => {
  if (typeof router === 'object' && typeof router?.handler !== 'function') {
    for (const key in router) {
      recursivelyApplyExpressRouter({
        router: (router as RecursiveRouterObj<any, any>)[key],
        path: [...path, key],
        routeTransformer,
      });
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

const contextMiddleware = ({
  contextFunction,
  route,
}: {
  contextFunction?: ContextFunction<any, any>;
  route: AppRoute;
}): TsRestRequestHandler<any, any> => {
  return (req, res, next) => {
    (async () => {
      let context = undefined;

      if (contextFunction) {
        context = await contextFunction({ req, route });
      }

      req.tsRest = {
        route,
        context,
      };

      next();
    })();
  };
};

const transformAppRouteQueryImplementation = ({
  implementationOrOptions,
  schema,
  app,
  options,
  contextFunction,
}: {
  implementationOrOptions: AppRouteImplementationOrOptions<AppRouteQuery>;
  schema: AppRouteQuery;
  app: IRouter;
  options: Options;
  contextFunction?: ContextFunction<any, any>;
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

  const handlers: TsRestRequestHandler<AppRouteQuery>[] = [
    contextMiddleware({
      contextFunction,
      route: schema,
    }),
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

const transformAppRouteMutationImplementation = ({
  implementationOrOptions,
  schema,
  app,
  options,
  contextFunction,
}: {
  implementationOrOptions: AppRouteImplementationOrOptions<AppRouteMutation>;
  schema: AppRouteMutation;
  app: IRouter;
  options: Options;
  contextFunction?: ContextFunction<any, any>;
}) => {
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

  const handlers: TsRestRequestHandler<AppRouteMutation>[] = [
    contextMiddleware({
      contextFunction,
      route: schema,
    }),
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

export const createExpressEndpoints = <TContext, TRouter extends AppRouter>(
  schema: TRouter,
  router: CompleteRouterObj<TRouter, TContext>,
  app: IRouter,
  options: Options<TContext> = {
    logInitialization: true,
    jsonQuery: false,
    responseValidation: false,
  }
) => {
  recursivelyApplyExpressRouter({
    router,
    path: [],
    routeTransformer: (route, path) => {
      const routerViaPath = getValue(schema, path.join('.'));

      if (!routerViaPath) {
        throw new Error(`[ts-rest] No router found for path ${path.join('.')}`);
      }

      if (isAppRoute(routerViaPath)) {
        if (routerViaPath.method === 'GET') {
          transformAppRouteQueryImplementation({
            implementationOrOptions:
              route as AppRouteImplementationOrOptions<AppRouteQuery>,
            schema: routerViaPath,
            contextFunction: router[RouterOptions]?.contextFunction,
            app,
            options,
          });
        } else {
          transformAppRouteMutationImplementation({
            implementationOrOptions:
              route as AppRouteImplementationOrOptions<AppRouteMutation>,
            schema: routerViaPath,
            contextFunction: router[RouterOptions]?.contextFunction,
            app,
            options,
          });
        }
      } else {
        throw new Error(
          'Could not find schema route implementation for ' + path.join('.')
        );
      }
    },
  });
};
