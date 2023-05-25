import {
  FetchQueryOptions,
  InfiniteData,
  QueryFilters,
} from '@tanstack/query-core';
import {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions as TanStackUseInfiniteQueryOptions,
  useInfiniteQuery,
  UseMutationOptions as TanStackUseMutationOptions,
  useMutation,
  UseQueryOptions as TanStackUseQueryOptions,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  AreAllPropertiesOptional,
  ClientArgs,
  fetchApi,
  getCompleteUrl,
  getRouteQuery,
  isAppRoute,
  Prettify,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import {
  DataResponse,
  DataReturnArgs,
  DataReturnArgsBase,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from './types';
import { useMemo } from 'react';

type AppRouteFunctions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = {
  useQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute, TClientArgs>
    : never;
  useInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute, TClientArgs>
    : never;
  useQueries: TAppRoute extends AppRouteQuery
    ? DataReturnQueries<TAppRoute, TClientArgs>
    : never;
  query: TAppRoute extends AppRouteQuery
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
  useMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute, TClientArgs>
    : never;
  mutation: TAppRoute extends AppRouteMutation
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
};

type AppRouteFunctionsWithQueryClient<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = AppRouteFunctions<TAppRoute, TClientArgs> & {
  fetchQuery: TAppRoute extends AppRouteQuery
    ? DataReturnFetchQuery<TAppRoute, TClientArgs>
    : never;
  fetchInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnFetchInfiniteQuery<TAppRoute, TClientArgs>
    : never;
  prefetchQuery: TAppRoute extends AppRouteQuery
    ? DataReturnPrefetchQuery<TAppRoute, TClientArgs>
    : never;
  prefetchInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnPrefetchInfiniteQuery<TAppRoute, TClientArgs>
    : never;
  getQueryData: TAppRoute extends AppRouteQuery
    ? DataReturnGetQueryData<TAppRoute>
    : never;
  ensureQueryData: TAppRoute extends AppRouteQuery
    ? DataReturnFetchQuery<TAppRoute, TClientArgs>
    : never;
  getQueriesData: TAppRoute extends AppRouteQuery
    ? DataReturnGetQueriesData<TAppRoute>
    : never;
  setQueryData: TAppRoute extends AppRouteQuery
    ? DataReturnSetQueryData<TAppRoute>
    : never;
};

// Used on X.useQuery
type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: UseQueryOptions<TAppRoute>
    ) => UseQueryResult<TAppRoute>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: UseQueryOptions<TAppRoute>
    ) => UseQueryResult<TAppRoute>;

type DataReturnQueriesOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = Without<DataReturnArgs<TAppRoute, TClientArgs>, never> &
  Omit<UseQueryOptions<TAppRoute>, 'queryFn'> & {
    queryKey: QueryKey;
  };

type DataReturnQueries<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueries = readonly DataReturnQueriesOptions<TAppRoute, TClientArgs>[]
> = (args: {
  queries: TQueries;
  context?: UseQueryOptions<TAppRoute>['context'];
}) => UseQueryResult<TAppRoute>[];

// Used on X.useInfiniteQuery
type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  queryKey: QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>
  ) => Without<DataReturnArgs<TAppRoute, TClientArgs>, never>,
  options?: UseInfiniteQueryOptions<TAppRoute>
) => UseInfiniteQueryResult<TAppRoute>;

// Used pn X.useMutation
type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  options?: UseMutationOptions<TAppRoute, TClientArgs>
) => UseMutationResult<TAppRoute, TClientArgs>;

type DataReturnFetchQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: FetchQueryOptions<TAppRoute>
    ) => Promise<DataResponse<TAppRoute>>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: FetchQueryOptions<TAppRoute>
    ) => Promise<DataResponse<TAppRoute>>;

type DataReturnPrefetchQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: FetchQueryOptions<TAppRoute>
    ) => Promise<void>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: FetchQueryOptions<TAppRoute>
    ) => Promise<void>;

type DataReturnFetchInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = (
  queryKey: QueryKey,
  args: (context: QueryFunctionContext) => TArgs,
  options?: FetchQueryOptions<TAppRoute>
) => Promise<InfiniteData<DataResponse<TAppRoute>>>;

type DataReturnPrefetchInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = (
  queryKey: QueryKey,
  args: (context: QueryFunctionContext) => TArgs,
  options?: FetchQueryOptions<TAppRoute>
) => Promise<void>;

type DataReturnGetQueryData<TAppRoute extends AppRoute> = (
  queryKey: QueryKey,
  filters?: QueryFilters
) => DataResponse<TAppRoute> | undefined;

type DataReturnGetQueriesData<TAppRoute extends AppRoute> = (
  filters: QueryFilters
) => [queryKey: QueryKey, data: DataResponse<TAppRoute> | undefined][];

type DataReturnSetQueryData<TAppRoute extends AppRoute> = (
  queryKey: QueryKey,
  updater:
    | DataResponse<TAppRoute>
    | undefined
    | ((
        oldData: DataResponse<TAppRoute> | undefined
      ) => DataResponse<TAppRoute> | undefined)
) => DataResponse<TAppRoute> | undefined;

const queryFn = <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  args?: DataReturnArgsBase<TAppRoute, TClientArgs>
): QueryFunction<TAppRoute['responses']> => {
  return async () => {
    const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
      args || {};

    const path = getCompleteUrl(
      query,
      clientArgs.baseUrl,
      params,
      route,
      !!clientArgs.jsonQuery
    );

    const result = await fetchApi({
      path,
      clientArgs,
      route,
      body,
      query,
      headers: {
        ...extraHeaders,
        ...headers,
      },
      extraInputArgs,
    });

    // If the response is not a 2XX, throw an error to be handled by react-query
    if (!String(result.status).startsWith('2')) {
      throw result;
    }

    return result;
  };
};

const getRouteUseQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (
    queryKey: QueryKey,
    args?: DataReturnArgsBase<TAppRoute, TClientArgs>,
    options?: TanStackUseQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn = queryFn(route, clientArgs, args);

    return useQuery(queryKey, dataFn, options);
  };
};

const getRouteUseQueries = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (args: Parameters<DataReturnQueries<TAppRoute, TClientArgs>>[0]) => {
    const queries = args.queries.map((fullQueryArgs: any) => {
      const { credentials, queryKey, retry, ...queryArgs } = fullQueryArgs;
      const dataFn = queryFn(route, clientArgs, queryArgs);

      return {
        queryFn: dataFn,
        ...fullQueryArgs,
      };
    });

    return useQueries({ queries, context: args.context });
  };
};

const getRouteUseInfiniteQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (
    queryKey: QueryKey,
    argsMapper: (
      context: QueryFunctionContext
    ) => DataReturnArgsBase<TAppRoute, TClientArgs>,
    options?: TanStackUseInfiniteQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (context) => {
      const resultingQueryArgs = argsMapper(context);

      const innerDataFn = queryFn(route, clientArgs, resultingQueryArgs);

      return innerDataFn(undefined as any);
    };

    return useInfiniteQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (options?: TanStackUseMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args?: DataReturnArgsBase<TAppRoute, TClientArgs>
    ) => {
      const dataFn = queryFn(route, clientArgs, args);

      return dataFn(undefined as any);
    };

    return useMutation(
      mutationFunction as () => Promise<ZodInferOrType<TAppRoute['responses']>>,
      options
    );
  };
};

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<AppRouteFunctions<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? InitClientReturn<T[TKey], TClientArgs>
    : never;
};

const ClientParameters = Symbol('ClientParameters');

export const initQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs
>(
  router: T,
  clientArgs: TClientArgs
): InitClientReturn<T, TClientArgs> => {
  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner
  ): InitClientReturn<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        if (isAppRoute(subRouter)) {
          return [
            key,
            {
              query: getRouteQuery(subRouter, clientArgs),
              mutation: getRouteQuery(subRouter, clientArgs),
              useQuery: getRouteUseQuery(subRouter, clientArgs),
              useQueries: getRouteUseQueries(subRouter, clientArgs),
              useInfiniteQuery: getRouteUseInfiniteQuery(subRouter, clientArgs),
              useMutation: getRouteUseMutation(subRouter, clientArgs),
            },
          ];
        } else {
          return [key, recursiveInit(subRouter)];
        }
      })
    );
  };

  return {
    ...recursiveInit(router),
    [ClientParameters]: {
      router,
      clientArgs,
    },
  };
};

type InitUseTsRestQueryClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<AppRouteFunctionsWithQueryClient<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? InitUseTsRestQueryClientReturn<T[TKey], TClientArgs>
    : never;
};

export const useTsRestQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs
>(
  client: InitClientReturn<T, TClientArgs>
): InitUseTsRestQueryClientReturn<T, TClientArgs> => {
  // @ts-expect-error - hidden symbol, so we can refetch the original client router and clientArgs
  const { router, clientArgs } = client[ClientParameters] as unknown as {
    router: T;
    clientArgs: TClientArgs;
  };

  const queryClient = useQueryClient();

  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
    innerClient: InitClientReturn<TInner, TClientArgs>
  ): InitUseTsRestQueryClientReturn<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        if (isAppRoute(subRouter)) {
          type TSubRouter = typeof subRouter;

          return [
            key,
            {
              ...innerClient[key],
              fetchQuery: (
                queryKey: QueryKey,
                args: DataReturnArgsBase<TSubRouter, TClientArgs>,
                options?: FetchQueryOptions<any>
              ) => {
                console.log('fetchQuery', queryKey, args, options);
                const dataFn = queryFn(subRouter, clientArgs, args);
                return queryClient.fetchQuery(queryKey, dataFn, options);
              },
              fetchInfiniteQuery: (
                queryKey: QueryKey,
                argsMapper: (
                  context: QueryFunctionContext
                ) => DataReturnArgsBase<TSubRouter, TClientArgs>,
                options?: FetchQueryOptions<any>
              ) => {
                return queryClient.fetchInfiniteQuery(
                  queryKey,
                  async (context) => {
                    const resultingQueryArgs = argsMapper(context);

                    const innerDataFn = queryFn(
                      subRouter,
                      clientArgs,
                      resultingQueryArgs
                    );

                    return innerDataFn(undefined as any);
                  },
                  options
                );
              },
              prefetchQuery: (
                queryKey: QueryKey,
                args: DataReturnArgsBase<TSubRouter, TClientArgs>,
                options?: FetchQueryOptions<any>
              ) => {
                const dataFn = queryFn(subRouter, clientArgs, args);

                return queryClient.prefetchQuery(queryKey, dataFn, options);
              },
              prefetchInfiniteQuery: (
                queryKey: QueryKey,
                argsMapper: (
                  context: QueryFunctionContext
                ) => DataReturnArgsBase<TSubRouter, TClientArgs>,
                options?: FetchQueryOptions<any>
              ) => {
                return queryClient.prefetchInfiniteQuery(
                  queryKey,
                  async (context) => {
                    const resultingQueryArgs = argsMapper(context);

                    const innerDataFn = queryFn(
                      subRouter,
                      clientArgs,
                      resultingQueryArgs
                    );

                    return innerDataFn(undefined as any);
                  },
                  options
                );
              },
              getQueryData: (queryKey: QueryKey, filters?: QueryFilters) => {
                return queryClient.getQueryData(queryKey, filters);
              },
              ensureQueryData: (
                queryKey: QueryKey,
                args: DataReturnArgsBase<TSubRouter, TClientArgs>,
                options?: FetchQueryOptions<any>
              ) => {
                const dataFn = queryFn(subRouter, clientArgs, args);

                return queryClient.ensureQueryData(queryKey, dataFn, options);
              },
              getQueriesData: (filters: QueryFilters) => {
                return queryClient.getQueriesData(filters);
              },
              setQueryData: (queryKey: QueryKey, updater: any) => {
                return queryClient.setQueryData(queryKey, updater);
              },
            },
          ];
        } else {
          return [key, recursiveInit(subRouter, innerClient[key] as any)];
        }
      })
    );
  };

  return useMemo(() => recursiveInit(router, client), [client]);
};
