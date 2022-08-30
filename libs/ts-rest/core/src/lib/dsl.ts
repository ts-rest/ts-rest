import { Narrow } from './type-utils';

/**
 * A query endpoint. In REST terms, one using GET.
 */
export type AppRouteQuery = {
  method: 'GET';
  /**
   * The path with colon-prefixed parameters
   * e.g. "/posts/:id".
   */
  path: string;
  query?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  responses: Record<number, unknown>;
};

/**
 * A mutation endpoint. In REST terms, one using POST, PUT,
 * PATCH, or DELETE.
 */
export type AppRouteMutation = {
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  /**
   * The path with colon-prefixed parameters
   * e.g. "/posts/:id".
   */
  path: string;
  body: unknown;
  query?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  responses: Record<number, unknown>;
};

/**
 * A union of all possible endpoint types.
 */
export type AppRoute = AppRouteQuery | AppRouteMutation;

/**
 * A router (or contract) in @ts-rest is a collection of more routers or
 * individual routes
 */
export type AppRouter = {
  [key: string]: AppRouter | AppRoute;
};

/**
 * Differentiate between a route and a router
 *
 * @param obj
 * @returns
 */
export const isAppRoute = (obj: AppRoute | AppRouter): obj is AppRoute => {
  return obj?.method !== undefined;
};

/**
 * The instantiated ts-rest client
 */
type ContractInstance = {
  /**
   * A collection of routes or routers
   */
  router: <T extends AppRouter>(endpoints: Narrow<T>) => T;
  /**
   * A single query route, should exist within
   * a {@link AppRouter}
   */
  query: <T extends AppRouteQuery>(query: Narrow<T>) => T;
  /**
   * A single mutation route, should exist within
   * a {@link AppRouter}
   */
  mutation: <T extends AppRouteMutation>(mutation: Narrow<T>) => T;
  /**
   * Exists to allow storing a Type in the contract (at compile time only)
   */
  response: <T>() => T;
  /**
   * Exists to allow storing a Type in the contract (at compile time only)
   */
  body: <T>() => T;
};

/**
 *
 * @deprecated Please use {@link initContract} instead.
 */
export const initTsRest = (): ContractInstance => initContract();

/**
 * Instantiate a ts-rest client, primarily to access `router`, `response`, and `body`
 *
 * @returns {ContractInstance}
 */
export const initContract = (): ContractInstance => {
  return {
    // @ts-expect-error - this is a type error, but it's not clear how to fix it
    router: (args) => args,
    // @ts-expect-error - this is a type error, but it's not clear how to fix it
    query: (args) => args,
    // @ts-expect-error - this is a type error, but it's not clear how to fix it
    mutation: (args) => args,
    response: <T>() => undefined as unknown as T,
    body: <T>() => undefined as unknown as T,
  };
};
