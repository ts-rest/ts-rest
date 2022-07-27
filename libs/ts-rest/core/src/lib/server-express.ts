import { Express, RequestHandler } from 'express';
import { z } from 'zod';
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  isAppRoute,
} from './dsl';
import { getAppRoutePathRoute } from './server';
import { getValue } from '@tscont/ts-rest-utils';

type AppRouteQueryImplementation<T extends AppRouteQuery> = (input: {
  params: Parameters<T['path']>[0];
}) => Promise<T['response']>;

type AppRouteMutationImplementation<T extends AppRouteMutation> = (input: {
  params: Parameters<T['path']>[0];
  body: T['body'] extends z.AnyZodObject ? z.infer<T['body']> : null;
}) => Promise<T['response']>;

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
  app: Express
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[tscont] Initialized ${schema.method} ${path}`);

  app.get(path, async (req, res) => {
    return res.json(await route({ params: req.params }));
  });
};

const transformAppRouteMutationImplementation = (
  route: AppRouteMutationImplementation<any>,
  schema: AppRouteMutation,
  app: Express
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[tscont] Initialized ${schema.method} ${path}`);

  const method = schema.method;

  const callback: RequestHandler = async (req, res) => {
    try {
      const result = await route({ params: req.params, body: req.body });
      return res.json(result);
    } catch (e) {
      console.error(`[tscont] Error on ${method} ${path}`, e);
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
  schema: AppRouter,
  router: T,
  app: Express
) => {
  recursivelyApplyExpressRouter(router, [], (route, path) => {
    const routerViaPath = getValue(schema, path.join('.'));

    if (isAppRoute(routerViaPath)) {
      if (routerViaPath.__type === 'AppRouteMutation') {
        transformAppRouteMutationImplementation(route, routerViaPath, app);
      } else {
        transformAppRouteQueryImplementation(
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
