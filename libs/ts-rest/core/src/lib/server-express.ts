import { Express } from 'express';
import { AppRoute, AppRouter, isAppRoute } from './dsl';
import { getAppRoutePathRoute } from './server';
import { getValue } from './type-utils';

type AppRouteImplementation<T extends AppRoute> = (
  params: Parameters<T['path']>[0]
) => Promise<T['response']>;

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

type ExpressRouteTransformer = (
  route: AppRouteImplementation<any>,
  schema: AppRoute,
  app: Express
) => void;

const transformAppRouteImplementation: ExpressRouteTransformer = (
  route,
  schema,
  app
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[tscont] Initialized ${schema.method} ${path}`);

  app.get(path, async (req, res) => {
    const result = await route(req.params);

    return res.json(result);
  });
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
      transformAppRouteImplementation(route, routerViaPath, app);
    } else {
      throw new Error(
        'Could not find schema route implementation for ' + path.join('.')
      );
    }
  });
};
