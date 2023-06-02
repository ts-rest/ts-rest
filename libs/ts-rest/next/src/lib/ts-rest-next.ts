import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Lib is designed to follow the same structure as
 * traditional Next.js apps, with a pages folder.
 */

import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  isAppRoute,
  parseJsonQueryObject,
  ServerInferRequest,
  ServerInferResponses,
  validateResponse,
} from '@ts-rest/core';
import { getPathParamsFromArray } from './path-utils';

type RouteToQueryFunctionImplementation<T extends AppRouteQuery> = (
  args: Omit<ServerInferRequest<T>, 'body'> & {
    req: NextApiRequest;
    res: NextApiResponse;
  }
) => Promise<ServerInferResponses<T>>;

type RouteToMutationFunctionImplementation<T extends AppRouteMutation> = (
  args: ServerInferRequest<T> & {
    req: NextApiRequest;
    res: NextApiResponse;
  }
) => Promise<ServerInferResponses<T>>;

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

/**
 * Combine all AppRoutes with their implementations into a single object
 * which is easier to work with
 * @param router
 * @param implementation
 * @returns
 */
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

/**
 * Check whether the route is correct
 *
 * @param route
 * @param query
 * @param method
 * @returns
 */
const isRouteCorrect = (route: AppRoute, query: string[], method: string) => {
  const pathAsArray = route.path.split('/').slice(1);

  if (pathAsArray.length === query.length && route.method === method) {
    let matches = true;

    for (let i = 0; i < pathAsArray.length; i++) {
      const isCurrElementWildcard = pathAsArray[i].startsWith(':');

      if (!isCurrElementWildcard && pathAsArray[i] !== query[i]) {
        matches = false;
      }
    }

    return matches;
  }

  return false;
};

/**
 * Takes a completed app router (with implementations) and attempts to
 * match up the request to the correct route
 *
 * @param router
 * @param query
 * @param method
 * @returns
 */
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

/**
 * Create the implementation for a given AppRouter.
 *
 * @param appRouter - AppRouter
 * @param implementation - Implementation of the AppRouter, e.g. your API controllers
 * @returns
 */
export const createNextRoute = <T extends AppRouter>(
  appRouter: T,
  implementation: RecursiveRouterObj<T>
) => implementation;

/**
 * Turn a completed set of Next routes into a Next.js compatible route.
 *
 * Should be exported from your [...ts-rest].tsx file.
 *
 * e.g.
 *
 * ```typescript
 * export default createNextRouter(contract, implementation);
 * ```
 *
 * @param routes
 * @param obj
 * @param options
 * @returns
 */
export const createNextRouter = <T extends AppRouter>(
  routes: T,
  obj: RecursiveRouterObj<T>,
  options?: {
    jsonQuery?: boolean;
    responseValidation?: boolean;
    errorHandler?: (
      err: unknown,
      req: NextApiRequest,
      res: NextApiResponse
    ) => void;
  }
) => {
  const { jsonQuery = false, responseValidation = false } = options || {};

  const combinedRouter = mergeRouterAndImplementation(routes, obj);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    let { 'ts-rest': params, ...query } = req.query;
    params = (params as string[]) || [];

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

    const pathParamsResult = checkZodSchema(pathParams, route.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!pathParamsResult.success) {
      return res.status(400).json(pathParamsResult.error);
    }

    const headersResult = checkZodSchema(req.headers, route.headers, {
      passThroughExtraKeys: true,
    });

    if (!headersResult.success) {
      return res.status(400).send(headersResult.error);
    }

    query = jsonQuery
      ? parseJsonQueryObject(query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, route.query);

    if (!queryResult.success) {
      return res.status(400).json(queryResult.error);
    }

    const bodyResult = checkZodSchema(req.body, route.body);

    if (!bodyResult.success) {
      return res.status(400).json(bodyResult.error);
    }

    try {
      const { body, status } = await route.implementation({
        body: bodyResult.data,
        query: queryResult.data,
        params: pathParamsResult.data,
        headers: headersResult.data,
        req,
        res,
      });

      const statusCode = Number(status);

      if (responseValidation) {
        const response = validateResponse({
          responseType: route.responses[statusCode],
          response: {
            status: statusCode,
            body: body,
          },
        });

        return res.status(statusCode).json(response.body);
      }

      return res.status(statusCode).json(body);
    } catch (e) {
      if (options?.errorHandler) {
        options.errorHandler(e, req, res);
        return;
      }

      throw e;
    }
  };
};
