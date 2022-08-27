import { Express, RequestHandler } from 'express';
import { z, ZodTypeAny } from 'zod';
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  isAppRoute,
  getAppRoutePathRoute,
  getValue,
  Without,
  ZodInferOrType,
  returnZodErrorsIfZodSchema,
} from '@ts-rest/core';

export type ApiRouteResponse<T> = {
  [K in keyof T]: {
    status: K;
    body: ZodInferOrType<T[K]>;
  };
}[keyof T];

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: Parameters<T['path']>[0] extends undefined
        ? never
        : Parameters<T['path']>[0];
      query: T['query'] extends ZodTypeAny ? z.infer<T['query']> : null;
    },
    never
  >
) => Promise<ApiRouteResponse<T['responses']>>;

type AppRouteMutationImplementation<T extends AppRouteMutation> = (
  input: Without<
    {
      params: Parameters<T['path']>[0];
      query: T['query'] extends ZodTypeAny ? z.infer<T['query']> : never;
      body: T['body'] extends ZodTypeAny ? z.infer<T['body']> : never;
    },
    never
  >
) => Promise<ApiRouteResponse<T['responses']>>;

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

export const initServer = () => {
  return {
    router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) =>
      args,
  };
};

const recursivelyApplyExpressRouter = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: RecursiveRouterObj<any> | AppRouteImplementation<any>,
  path: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: AppRouteQueryImplementation<any>,
  schema: AppRouteQuery,
  app: Express
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[ts-rest] Initialized ${schema.method} ${path}`);

  app.get(path, async (req, res) => {
    const zodQueryIssues = returnZodErrorsIfZodSchema(schema.query, req.query);

    if (zodQueryIssues.length > 0) {
      return res.status(400).json({
        errors: zodQueryIssues,
      });
    }

    const result = await route({ params: req.params, query: req.query });

    return res.status(Number(result.status)).json(result.body);
  });
};

const transformAppRouteMutationImplementation = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: AppRouteMutationImplementation<any>,
  schema: AppRouteMutation,
  app: Express
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[ts-rest] Initialized ${schema.method} ${path}`);

  const method = schema.method;

  const callback: RequestHandler = async (req, res) => {
    try {
      const zodBodyIssues = returnZodErrorsIfZodSchema(schema.body, req.body);

      if (zodBodyIssues.length > 0) {
        return res.status(400).json({
          errors: zodBodyIssues,
        });
      }

      const zodQueryIssues = returnZodErrorsIfZodSchema(
        schema.query,
        req.query
      );

      if (zodQueryIssues.length > 0) {
        return res.status(400).json({
          errors: zodQueryIssues,
        });
      }

      const result = await route({
        params: req.params,
        body: req.body,
        query: req.query,
      });

      return res.status(Number(result.status)).json(result.body);
    } catch (e) {
      console.error(`[ts-rest] Error on ${method} ${path}`, e);
      return res.status(500).send('Internal Server Error');
    }
  };

  switch (method) {
    case 'DELETE':
      app.delete(path, callback);
      break;
    case 'POST':
      app.post(path, callback);
      break;
    case 'PUT':
      app.put(path, callback);
      break;
    case 'PATCH':
      app.patch(path, callback);
      break;
    default:
      // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = method;
  }
};

export const createExpressEndpoints = <
  T extends RecursiveRouterObj<TRouter>,
  TRouter extends AppRouter
>(
  schema: TRouter,
  router: T,
  app: Express
) => {
  recursivelyApplyExpressRouter(router, [], (route, path) => {
    const routerViaPath = getValue(schema, path.join('.'));

    if (!routerViaPath) {
      throw new Error(`[ts-rest] No router found for path ${path.join('.')}`);
    }

    if (isAppRoute(routerViaPath)) {
      if (routerViaPath.__tsType === 'AppRouteMutation') {
        transformAppRouteMutationImplementation(route, routerViaPath, app);
      } else {
        transformAppRouteQueryImplementation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          route as AppRouteQueryImplementation<any>,
          routerViaPath,
          app
        );
      }
    } else {
      throw new Error(
        'Could not find schema route implementation for ' + path.join('.')
      );
    }
  });
};
