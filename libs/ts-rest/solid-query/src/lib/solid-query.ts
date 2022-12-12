import {
  createInfiniteQuery,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  createMutation,
  CreateMutationOptions,
  CreateMutationResult,
  createQuery,
  CreateQueryOptions,
  CreateQueryResult,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/solid-query';
import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  fetchApi,
  getCompleteUrl,
  getRouteQuery,
  HTTPStatusCode,
  isAppRoute,
  PathParamsFromUrl,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import { z, ZodTypeAny } from 'zod';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey]>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.input<T> : T;

type UseQueryArgs<TAppRoute extends AppRoute> = {
  createQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute>
    : never;
  createInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute>
    : never;
  query: TAppRoute extends AppRouteQuery ? AppRouteFunction<TAppRoute> : never;
  createMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute>
    : never;
  mutation: TAppRoute extends AppRouteMutation
    ? AppRouteFunction<TAppRoute>
    : never;
};

type DataReturnArgs<TRoute extends AppRoute> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']> extends null
      ? never
      : AppRouteMutationType<TRoute['body']>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: TRoute['query'] extends ZodTypeAny
    ? AppRouteMutationType<TRoute['query']> extends null
      ? never
      : AppRouteMutationType<TRoute['query']>
    : never;
};

/**
 * Split up the data and error to support solid-query style
 * createQuery and createMutation error handling
 */
type SuccessResponseMapper<T> = {
  [K in keyof T]: K extends SuccessfulHttpStatusCode
    ? { status: K; body: ZodInferOrType<T[K]> }
    : never;
}[keyof T];

/**
 * Returns any handled errors, or any unhandled non success errors
 */
type ErrorResponseMapper<T> =
  | {
      [K in keyof T]: K extends SuccessfulHttpStatusCode
        ? never
        : { status: K; body: ZodInferOrType<T[K]> };
    }[keyof T]
  // If the response isn't one of our typed ones. Return "unknown"
  | {
      status: Exclude<HTTPStatusCode, keyof T | SuccessfulHttpStatusCode>;
      body: unknown;
    };

// Data response if it's a 2XX
type DataResponse<T extends AppRoute> = SuccessResponseMapper<T['responses']>;

// Error response if it's not a 2XX
type ErrorResponse<T extends AppRoute> = ErrorResponseMapper<T['responses']>;

// Used on X.createQuery
type DataReturnQuery<TAppRoute extends AppRoute> = (
  queryKey: () => QueryKey,
  args: Without<DataReturnArgs<TAppRoute>, never>,
  options?: CreateQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >
) => CreateQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

// Used on X.useInfiniteQuery
type DataReturnInfiniteQuery<TAppRoute extends AppRoute> = (
  queryKey: () => QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>
  ) => Without<DataReturnArgs<TAppRoute>, never>,
  options?: CreateInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >
) => CreateInfiniteQueryResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>
>;

// Used pn X.createMutation
type DataReturnMutation<TAppRoute extends AppRoute> = (
  options?: CreateMutationOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    Without<DataReturnArgs<TAppRoute>, never>,
    unknown
  >
) => CreateMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  Without<DataReturnArgs<TAppRoute>, never>,
  unknown
>;

const getRouteUseQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (
    queryKey: () => QueryKey,
    args: DataReturnArgs<TAppRoute>,
    options?: CreateQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async () => {
      const path = getCompleteUrl(
        args.query,
        clientArgs.baseUrl,
        args.params,
        route
      );

      const result = await fetchApi(path, clientArgs, route, args.body);

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return createQuery(queryKey, dataFn, options);
  };
};

const getRouteUseInfiniteQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (
    queryKey: () => QueryKey,
    args: (context: QueryFunctionContext) => DataReturnArgs<TAppRoute>,
    options?: CreateInfiniteQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (
      infiniteQueryParams
    ) => {
      const resultingQueryArgs = args(infiniteQueryParams);

      const path = getCompleteUrl(
        resultingQueryArgs.query,
        clientArgs.baseUrl,
        resultingQueryArgs.params,
        route
      );

      const result = await fetchApi(
        path,
        clientArgs,
        route,
        resultingQueryArgs.body
      );

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return createInfiniteQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (options?: CreateMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (args: DataReturnArgs<TAppRoute>) => {
      const path = getCompleteUrl(
        args.query,
        clientArgs.baseUrl,
        args.params,
        route
      );

      const result = await fetchApi(path, clientArgs, route, args.body);

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return createMutation(
      mutationFunction as () => Promise<ZodInferOrType<TAppRoute['responses']>>,
      options
    );
  };
};

const createNewProxy = (router: AppRouter | AppRoute, args: ClientArgs) => {
  return new Proxy(
    {},
    {
      get: (_, propKey): any => {
        if (isAppRoute(router)) {
          switch (propKey) {
            case 'query':
              return getRouteQuery(router, args);
            case 'mutation':
              return getRouteQuery(router, args);
            case 'createQuery':
              return getRouteUseQuery(router, args);
            case 'createInfiniteQuery':
              return getRouteUseInfiniteQuery(router, args);
            case 'createMutation':
              return getRouteUseMutation(router, args);
            default:
              throw new Error(`Unknown method called on ${String(propKey)}`);
          }
        } else {
          const subRouter = router[propKey as string];

          return createNewProxy(subRouter, args);
        }
      },
    }
  );
};

export type InitClientReturn<T extends AppRouter> = RecursiveProxyObj<T>;

export const initQueryClient = <T extends AppRouter>(
  router: T,
  args: ClientArgs
): InitClientReturn<T> => {
  const proxy = createNewProxy(router, args);

  return proxy as InitClientReturn<T>;
};
