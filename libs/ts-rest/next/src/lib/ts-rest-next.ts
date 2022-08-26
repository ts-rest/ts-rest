import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Lib is designed to follow the same structure as
 * traditional Next.js apps, with a pages folder.
 */

import {
  ApiRouteResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  getAppRoutePathRoute,
  getPathParamsFromArray,
  isAppRoute,
  ZodInferOrType,
} from '@ts-rest/core';

type RouteToQueryFunctionImplementation<T extends AppRouteQuery> = (args: {
  params: Parameters<T['path']>[0];
  query: ZodInferOrType<T['query']>;
}) => Promise<ApiRouteResponse<T['responses']>>;

type RouteToMutationFunctionImplementation<T extends AppRouteMutation> =
  (args: {
    params: Parameters<T['path']>[0];
    body: ZodInferOrType<T['body']>;
    query: ZodInferOrType<T['query']>;
  }) => Promise<ApiRouteResponse<T['responses']>>;

type RouteToFunctionImplementation<T extends AppRoute> = T extends AppRouteQuery
  ? RouteToQueryFunctionImplementation<T>
  : T extends AppRouteMutation
  ? RouteToMutationFunctionImplementation<T>
  : never;

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? RouteToFunctionImplementation<T[TKey]>
    : never;
};

type AppRouteQueryWithImplementation<T extends AppRouteQuery> = T &
  RouteToQueryFunctionImplementation<T>;

type AppRouteMutationWithImplementation<T extends AppRouteMutation> = T &
  RouteToMutationFunctionImplementation<T>;

type AppRouteWithImplementation<T extends AppRoute> = T extends AppRouteMutation
  ? AppRouteMutationWithImplementation<T>
  : T extends AppRouteQuery
  ? AppRouteQueryWithImplementation<T>
  : never;

type AppRouterWithImplementation = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: AppRouterWithImplementation | AppRouteWithImplementation<any>;
};

const mergeRouterAndImplementation = <T extends AppRouter>(
  router: T,
  implementation: RecursiveRouterObj<T>
): AppRouterWithImplementation => {
  const keys = Object.keys(router);

  return keys.reduce((acc, key) => {
    const existing = router[key];
    const existingImpl = implementation[key];

    if (isAppRoute(existing)) {
      acc[key] = { ...existing, implementation: existingImpl };
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[key] = mergeRouterAndImplementation(existing, existingImpl);
    }
    return acc;
  }, {} as AppRouterWithImplementation);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isAppRouteWithImplementation = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): obj is AppRouteWithImplementation<any> => {
  return obj?.implementation !== undefined && obj?.method;
};

const isRouteCorrect = (route: AppRoute, query: string[], method: string) => {
  const path = getAppRoutePathRoute(route, { formatter: () => '-' });

  const pathAsArray = path.split('/').slice(1);

  if (pathAsArray.length === query.length && route.method === method) {
    let matches = true;

    for (let i = 0; i < pathAsArray.length; i++) {
      if (pathAsArray[i] !== '-' && pathAsArray[i] !== query[i]) {
        matches = false;
      }
    }

    return matches;
  }

  return false;
};

const getRouteImplementation = (
  router: AppRouterWithImplementation,
  query: string[],
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): AppRouteWithImplementation<any> | null => {
  const keys = Object.keys(router);

  for (const key of keys) {
    const appRoute = router[key];

    if (isAppRouteWithImplementation(appRoute)) {
      if (isRouteCorrect(appRoute, query, method)) {
        return appRoute;
      }
    } else {
      const route = getRouteImplementation(appRoute, query, method);

      if (route) {
        return route;
      }
    }
  }

  return null;
};

export const createNextRoute =
  <T extends AppRouter>(routes: T, obj: RecursiveRouterObj<T>) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const params = (req.query?.['ts-rest'] as string[]) || [];

    const combinedRouter = mergeRouterAndImplementation(routes, obj);

    const route = getRouteImplementation(
      combinedRouter,
      params,
      req.method as string
    );

    if (!route) {
      res.status(404).end();
      return;
    }

    const pathParams = getPathParamsFromArray(params, route);

    const { body, status } = await route.implementation({
      body: req.body,
      query: req.query,
      params: pathParams,
    });

    res.status(Number(status)).json(body);
  };
