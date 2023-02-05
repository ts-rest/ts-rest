import {
  ApiRouteServerResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  GetFieldType,
  isAppRoute,
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
} from 'express-serve-static-core';
import type { IncomingHttpHeaders } from 'http';

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
      headers: IncomingHttpHeaders;
      req: Request;
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
      headers: IncomingHttpHeaders;
      files: unknown;
      file: unknown;
      req: Request;
    },
    never
  >
) => Promise<ApiRouteServerResponse<T['responses']>>;

type AppRouteImplementation<T extends AppRoute> = T extends AppRouteMutation
  ? AppRouteMutationImplementation<T>
  : T extends AppRouteQuery
  ? AppRouteQueryImplementation<T>
  : never;

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementation<T[TKey]>
    : never;
};

type Options = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
};

export const initServer = () => {
  return {
    router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) =>
      args,
  };
};

const recursivelyApplyExpressRouter = (
  router: RecursiveRouterObj<any> | AppRouteImplementation<any>,
  path: string[],
  routeTransformer: (route: AppRouteImplementation<any>, path: string[]) => void
): void => {
  if (typeof router === 'object') {
    for (const key in router) {
      recursivelyApplyExpressRouter(
        router[key],
        [...path, key],
        routeTransformer
      );
    }
  } else if (typeof router === 'function') {
    routeTransformer(router, path);
  }
};

const transformAppRouteQueryImplementation = (
  route: AppRouteQueryImplementation<any>,
  schema: AppRouteQuery,
  app: IRouter,
  options: Options
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);
  }

  app.get(schema.path, async (req, res, next) => {
    const query = options.jsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, schema.query);

    if (!queryResult.success) {
      return res.status(400).send(queryResult.error);
    }

    const paramsResult = checkZodSchema(req.params, schema.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!paramsResult.success) {
      return res.status(400).send(paramsResult.error);
    }

    try {
      const result = await route({
        params: paramsResult.data,
        query: queryResult.data,
        headers: req.headers,
        req: req,
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
      return next?.(e);
    }
  });
};

const transformAppRouteMutationImplementation = (
  route: AppRouteMutationImplementation<any>,
  schema: AppRouteMutation,
  app: IRouter,
  options: Options
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);
  }

  const method = schema.method;

  const reqHandler: RequestHandler = async (req, res, next) => {
    const query = options.jsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, schema.query);

    if (!queryResult.success) {
      return res.status(400).send(queryResult.error);
    }

    const bodyResult = checkZodSchema(req.body, schema.body);

    if (!bodyResult.success) {
      return res.status(400).send(bodyResult.error);
    }

    const paramsResult = checkZodSchema(req.params, schema.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!paramsResult.success) {
      return res.status(400).send(paramsResult.error);
    }

    try {
      const result = await route({
        params: paramsResult.data,
        body: bodyResult.data,
        query: queryResult.data,
        headers: req.headers,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        files: req.files,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        file: req.file,
        req: req,
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
      return next?.(e);
    }
  };

  switch (method) {
    case 'DELETE':
      app.delete(schema.path, reqHandler);
      break;
    case 'POST':
      app.post(schema.path, reqHandler);
      break;
    case 'PUT':
      app.put(schema.path, reqHandler);
      break;
    case 'PATCH':
      app.patch(schema.path, reqHandler);
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
          route as AppRouteQueryImplementation<any>,
          routerViaPath,
          app,
          options
        );
      } else {
        transformAppRouteMutationImplementation(
          route,
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
