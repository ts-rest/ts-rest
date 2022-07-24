import { Express } from 'express';
import { AppRoute, AppRouter, isAppRoute } from './dsl';
import { getValue, NoExtraProperties } from './type-utils';

type AppRouteImplementation<T extends AppRoute> = (
  params: Parameters<T['path']>[0]
) => NoExtraProperties<T['response']>;

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
  // We don't know the path params at runtime, so use a proxy object to create the routes
  const proxyObj: Record<string, string> = {};
  const pathParamGenerator = new Proxy(proxyObj, {
    get: (_, key) => {
      return `:${String(key)}`;
    },
  });

  // E.g. ({id, commentId}) => `/posts/:id/comments/:commentId`
  const path = schema.path(pathParamGenerator);

  console.log(`[tscont] Initialized ${schema.method} ${path}`);

  app.get(path, (req, res) => {
    res.json(route(req.params));
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
