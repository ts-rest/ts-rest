import { z, ZodTypeAny } from 'zod';
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  DataReturn,
  defaultApi,
  getRouteQuery,
  isAppRoute,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
  HTTPStatusCode,
  PathParams,
} from '@ts-rest/core';
import {
  QueryFunction,
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  convertQueryParamsToUrlString,
  insertParamsIntoPath,
} from '@ts-rest/core';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey]>, never>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.infer<T> : T;

type UseQueryArgs<TAppRoute extends AppRoute> = {
  useQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute>
    : never;
  query: TAppRoute extends AppRouteQuery ? DataReturn<TAppRoute> : never;
  useMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute>
    : never;
  mutation: TAppRoute extends AppRouteMutation ? DataReturn<TAppRoute> : never;
};

type DataReturnArgs<TRoute extends AppRoute> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']> extends null
      ? never
      : AppRouteMutationType<TRoute['body']>
    : never;
  params: PathParams<TRoute>;
  query: TRoute['query'] extends ZodTypeAny
    ? AppRouteMutationType<TRoute['query']> extends null
      ? never
      : AppRouteMutationType<TRoute['query']>
    : never;
};

/**
 * Split up the data and error to support react-query style
 * useQuery and useMutation error handling
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

// Used on X.useQuery
type DataReturnQuery<TAppRoute extends AppRoute> = (
  queryKey: QueryKey,
  args: Without<DataReturnArgs<TAppRoute>, never>,
  options?: UseQueryOptions<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>
) => UseQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

// Used pn X.useMutation
type DataReturnMutation<TAppRoute extends AppRoute> = (
  options?: UseMutationOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    Without<DataReturnArgs<TAppRoute>, never>,
    unknown
  >
) => UseMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  Without<DataReturnArgs<TAppRoute>, never>,
  unknown
>;

const getCompleteUrl = (
  query: any,
  baseUrl: string,
  params: Record<string, string>,
  route: AppRoute
) => {
  const path = insertParamsIntoPath(route.path, params as any);
  const queryComponent = convertQueryParamsToUrlString(query);
  return `${baseUrl}${path}${queryComponent}`;
};

const getRouteUseQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (
    queryKey: QueryKey,
    args: DataReturnArgs<TAppRoute>,
    options?: UseQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async () => {
      const completeUrl = getCompleteUrl(
        args.query,
        clientArgs.baseUrl,
        // @ts-expect-error - we know this is a valid path param
        args.params,
        route
      );

      const apiFetcher = clientArgs.api || defaultApi;

      const result = await apiFetcher({
        path: completeUrl,
        method: route.method,
        headers: {
          ...clientArgs.baseHeaders,
        },
        body: undefined,
      });

      // If the response is not a 2XX, throw an error to be handled by react-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return useQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (options?: UseMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (args: DataReturnArgs<TAppRoute>) => {
      const completeUrl = getCompleteUrl(
        args.query,
        clientArgs.baseUrl,
        // @ts-expect-error - we know this is a valid path param
        args.params,
        route
      );

      const result = await defaultApi({
        path: completeUrl,
        method: route.method,
        headers: {
          ...clientArgs.baseHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.body),
      });

      // If the response is not a 2XX, throw an error to be handled by react-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return useMutation(
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
              throw getRouteQuery(router, args);
            case 'mutation':
              throw getRouteQuery(router, args);
            case 'useQuery':
              return getRouteUseQuery(router, args);
            case 'useMutation':
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
