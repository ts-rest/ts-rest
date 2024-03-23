import { Merge, Opaque, Prettify, WithoutUnknown } from './type-utils';
import { zodMerge } from './zod-utils';
import { z } from 'zod';

type MixedZodError<A, B> = Opaque<{ a: A; b: B }, 'MixedZodError'>;

/**
 * The path with colon-prefixed parameters
 * e.g. "/posts/:id".
 */
type Path = string;

declare const NullSymbol: unique symbol;

export type ContractPlainType<T> = Opaque<T, 'ContractPlainType'>;
export type ContractNullType = Opaque<typeof NullSymbol, 'ContractNullType'>;
export type ContractAnyType =
  | z.ZodSchema
  | ContractPlainType<unknown>
  | ContractNullType
  | null;
export type ContractOtherResponse<T extends ContractAnyType> = Opaque<
  { contentType: string; body: T },
  'ContractOtherResponse'
>;

type AppRouteCommon = {
  path: Path;
  pathParams?: ContractAnyType;
  query?: ContractAnyType;
  headers?: ContractAnyType;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  responses: Record<
    number,
    ContractAnyType | ContractOtherResponse<ContractAnyType>
  >;
  strictStatusCodes?: boolean;
  metadata?: unknown;

  /**
   * @deprecated Use `validateResponse` on the client options
   */
  validateResponseOnClient?: boolean;
};

/**
 * A query endpoint. In REST terms, one using GET.
 */
export type AppRouteQuery = AppRouteCommon & {
  method: 'GET';
};

/**
 * A mutation endpoint. In REST terms, one using POST, PUT,
 * PATCH, or DELETE.
 */
export type AppRouteMutation = AppRouteCommon & {
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  contentType?:
    | 'application/json'
    | 'multipart/form-data'
    | 'application/x-www-form-urlencoded';
  body: ContractAnyType;
};

type ValidatedHeaders<
  T extends AppRoute,
  TOptions extends RouterOptions,
  TOptionsApplied = ApplyOptions<T, TOptions>,
> = 'headers' extends keyof TOptionsApplied
  ? TOptionsApplied['headers'] extends MixedZodError<infer A, infer B>
    ? {
        _error: 'Cannot mix plain object types with Zod objects for headers';
        a: A;
        b: B;
      }
    : T
  : T;

/**
 * Recursively process a router, allowing for you to define nested routers.
 *
 * The main purpose of this is to convert all path strings into string constants so we can infer the path
 */
type RecursivelyProcessAppRouter<
  T extends AppRouter,
  TOptions extends RouterOptions,
> = {
  [K in keyof T]: T[K] extends AppRoute
    ? ValidatedHeaders<T[K], TOptions>
    : T[K] extends AppRouter
    ? RecursivelyProcessAppRouter<T[K], TOptions>
    : T[K];
};

type RecursivelyApplyOptions<
  TRouter extends AppRouter,
  TOptions extends RouterOptions,
> = {
  [TRouterKey in keyof TRouter]: TRouter[TRouterKey] extends AppRoute
    ? Prettify<ApplyOptions<TRouter[TRouterKey], TOptions>>
    : TRouter[TRouterKey] extends AppRouter
    ? RecursivelyApplyOptions<TRouter[TRouterKey], TOptions>
    : TRouter[TRouterKey];
};

type UniversalMerge<A, B> = A extends z.AnyZodObject
  ? B extends z.AnyZodObject
    ? z.ZodObject<
        z.objectUtil.MergeShapes<A['shape'], B['shape']>,
        B['_def']['unknownKeys'],
        B['_def']['catchall']
      >
    : unknown extends B
    ? A
    : MixedZodError<A, B>
  : unknown extends A
  ? B
  : B extends z.AnyZodObject
  ? MixedZodError<A, B>
  : unknown extends B
  ? A
  : Prettify<Merge<A, B>>;

type ApplyOptions<
  TRoute extends AppRoute,
  TOptions extends RouterOptions,
> = Omit<TRoute, 'headers' | 'path'> &
  WithoutUnknown<{
    path: TOptions['pathPrefix'] extends string
      ? `${TOptions['pathPrefix']}${TRoute['path']}`
      : TRoute['path'];
    headers: UniversalMerge<TOptions['baseHeaders'], TRoute['headers']>;
    strictStatusCodes: TRoute['strictStatusCodes'] extends boolean
      ? TRoute['strictStatusCodes']
      : TOptions['strictStatusCodes'] extends boolean
      ? TOptions['strictStatusCodes']
      : unknown;
  }>;

/**
 * A union of all possible endpoint types.
 */
export type AppRoute = AppRouteQuery | AppRouteMutation;
export type AppRouteStrictStatusCodes = Omit<AppRoute, 'strictStatusCodes'> & {
  strictStatusCodes: true;
};

/**
 * A router (or contract) in @ts-rest is a collection of more routers or
 * individual routes
 */
export type AppRouter = {
  [key: string]: AppRouter | AppRoute;
};

export type RouterOptions<TPrefix extends string = string> = {
  baseHeaders?: unknown;
  strictStatusCodes?: boolean;
  pathPrefix?: TPrefix;

  /**
   * @deprecated Use `validateResponse` on the client options
   */
  validateResponseOnClient?: boolean;
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
    TRouter extends AppRouter,
    TPrefix extends string,
    TOptions extends RouterOptions<TPrefix> = {},
  >(
    endpoints: RecursivelyProcessAppRouter<TRouter, TOptions>,
    options?: TOptions,
  ) => RecursivelyApplyOptions<TRouter, TOptions>;
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
   * @deprecated Please use type() instead.
   */
  response: <T>() => T extends null ? ContractNullType : ContractPlainType<T>;
  /**
   * @deprecated Please use type() instead.
   */
  body: <T>() => T extends null ? ContractNullType : ContractPlainType<T>;
  /**
   * Exists to allow storing a Type in the contract (at compile time only)
   */
  type: <T>() => T extends null ? ContractNullType : ContractPlainType<T>;
  /**
   * Define a custom response type
   */
  otherResponse: <T extends ContractAnyType>({
    contentType,
    body,
  }: {
    contentType: string;
    body: T;
  }) => ContractOtherResponse<T>;
};

/**
 *
 * @deprecated Please use {@link initContract} instead.
 */
export const initTsRest = (): ContractInstance => initContract();

const recursivelyApplyOptions = <T extends AppRouter>(
  router: T,
  options?: RouterOptions,
): T => {
  return Object.fromEntries(
    Object.entries(router).map(([key, value]) => {
      if (isAppRoute(value)) {
        return [
          key,
          {
            ...value,
            path: options?.pathPrefix
              ? options.pathPrefix + value.path
              : value.path,
            headers: zodMerge(options?.baseHeaders, value.headers),
            strictStatusCodes:
              value.strictStatusCodes ?? options?.strictStatusCodes,
            validateResponseOnClient:
              value.validateResponseOnClient ??
              options?.validateResponseOnClient,
          },
        ];
      } else {
        return [key, recursivelyApplyOptions(value, options)];
      }
    }),
  );
};

export const ContractPlainTypeRuntimeSymbol = Symbol(
  'ContractPlainType',
) as any;

/**
 * Instantiate a ts-rest client, primarily to access `router`, `response`, and `body`
 *
 * @returns {ContractInstance}
 */
export const initContract = (): ContractInstance => {
  return {
    // @ts-expect-error - this is a type error, but it's not clear how to fix it
    router: (endpoints, options) => recursivelyApplyOptions(endpoints, options),
    query: (args) => args,
    mutation: (args) => args,
    response: () => ContractPlainTypeRuntimeSymbol,
    body: () => ContractPlainTypeRuntimeSymbol,
    type: () => ContractPlainTypeRuntimeSymbol,
    otherResponse: <T extends ContractAnyType>({
      contentType,
      body,
    }: {
      contentType: string;
      body: T;
    }) =>
      ({
        contentType,
        body,
      }) as ContractOtherResponse<T>,
  };
};
