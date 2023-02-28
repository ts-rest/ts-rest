import { DefinedOrEmpty, Merge, Narrow } from './type-utils';

/**
 * The path with colon-prefixed parameters
 * e.g. "/posts/:id".
 */
type Path = string;

/**
 * A query endpoint. In REST terms, one using GET.
 */
export type AppRouteQuery = {
  method: 'GET';
  path: Path;
  pathParams?: unknown;
  query?: unknown;
  headers?: unknown;
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
  path: Path;
  pathParams?: unknown;
  contentType?: 'application/json' | 'multipart/form-data';
  body: unknown;
  query?: unknown;
  headers?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  responses: Record<number, unknown>;
};

/**
 * Recursively process a router, allowing for you to define nested routers.
 *
 * The main purpose of this is to convert all path strings into string constants so we can infer the path
 */
type RecursivelyProcessAppRouter<
  T extends AppRouter,
  TEndpoints extends T['endpoints'] = T['endpoints'],
  TOptions extends T['options'] = T['options']
> = {
  endpoints: {
    [K in keyof TEndpoints]: TEndpoints[K] extends AppRoute
      ? TEndpoints[K]
      : TEndpoints[K] extends AppRouter
      ? RecursivelyProcessAppRouter<{
          endpoints: TEndpoints[K]['endpoints'];
          options: CombineRouterOptions<TOptions, TEndpoints[K]['options']>;
        }>
      : TEndpoints[K];
  };
  options: TOptions;
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
  endpoints: {
    [key: string]: AppRouter | AppRoute;
  };
  options: RouterOptions;
};

export type RouterOptions = {
  baseHeaders?: unknown;
};

export type CombineRouterOptions<
  Parent extends RouterOptions | undefined,
  Child extends RouterOptions | undefined
> = {
  baseHeaders: Merge<
    DefinedOrEmpty<Parent, 'baseHeaders'>,
    DefinedOrEmpty<Child, 'baseHeaders'>
  >;
};

/**
 * Differentiate between a route and a router
 *
 * @param obj
 * @returns
 */
export const isAppRoute = (obj: AppRoute | AppRouter): obj is AppRoute => {
  return 'method' in obj && 'path' in obj;
};

/**
 * The instantiated ts-rest client
 */
type ContractInstance = {
  /**
   * A collection of routes or routers
   */
  router: <
    TEndpoints extends RecursivelyProcessAppRouter<AppRouter>['endpoints'],
    TOptions extends RouterOptions
  >(
    endpoints: Narrow<TEndpoints>,
    options?: Narrow<TOptions>
  ) => Narrow<{
    endpoints: TEndpoints;
    options: NonNullable<TOptions>;
  }>;
  /**
   * A single query route, should exist within
   * a {@link AppRouter}
   */
  query: <T extends AppRouteQuery>(query: T) => T;
  /**
   * A single mutation route, should exist within
   * a {@link AppRouter}
   */
  mutation: <T extends AppRouteMutation>(mutation: T) => T;
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
    router: (endpoints, options) => ({ endpoints, options: options || {} }),
    query: (args) => args,
    mutation: (args) => args,
    response: <T>() => undefined as unknown as T,
    body: <T>() => undefined as unknown as T,
  };
};
