import {
  FetchQueryOptions,
  FetchInfiniteQueryOptions,
  QueryFilters,
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
  QueryClient,
  useSuspenseQuery,
  useSuspenseQueries,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouteMutation,
  AppRouter,
  ClientArgs,
  ClientInferRequest,
  evaluateFetchApiArgs,
  fetchApi,
  getRouteQuery,
  isAppRoute,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import { useMemo } from 'react';
import {
  AppRouteFunctions,
  AppRouteFunctionsWithQueryClient,
  DataReturnQueries,
} from './inner-types';

const queryFn = <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  args?: ClientInferRequest<AppRouteMutation, ClientArgs>,
): QueryFunction<TAppRoute['responses']> => {
  return async (queryFnContext?: QueryFunctionContext) => {
    const fetchApiArgs = evaluateFetchApiArgs(route, clientArgs, args);
    const result = await fetchApi({
      ...fetchApiArgs,
      fetchOptions: {
        ...(queryFnContext?.signal && { signal: queryFnContext.signal }),
        ...fetchApiArgs.fetchOptions,
      },
    });

    // If the response is not a 2XX, throw an error to be handled by react-query
    if (!String(result.status).startsWith('2')) {
      throw result;
    }

    return result;
  };
};

type UseQueryFunction = typeof useQuery | typeof useSuspenseQuery;

const getRouteUseQuery = (useQueryFunction: UseQueryFunction) => {
  return <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs,
  ) => {
    return (
      options: TanStackUseQueryOptions<TAppRoute['responses']> & {
        request?: ClientInferRequest<AppRouteMutation, ClientArgs>;
      },
    ) => {
      const { request, ...useQueryOptions } = options;
      const dataFn = queryFn(route, clientArgs, request);

      return useQueryFunction({ queryFn: dataFn, ...useQueryOptions });
    };
  };
};

type UseQueriesFunction = typeof useQueries | typeof useSuspenseQueries;

const getRouteUseQueries = (useQueriesFunction: UseQueriesFunction) => {
  return <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs,
  ) => {
    return (args: Parameters<DataReturnQueries<TAppRoute, TClientArgs>>[0]) => {
      const queries = args.queries.map((fullQueryArgs: any) => {
        const { request, ...useQueriesOptions } = fullQueryArgs;
        const dataFn = queryFn(route, clientArgs, request);

        return {
          queryFn: dataFn,
          ...useQueriesOptions,
        };
      });

      return useQueriesFunction({ queries, combine: args.combine as any });
    };
  };
};

type UseInfiniteQueryFunction =
  | typeof useInfiniteQuery
  | typeof useSuspenseInfiniteQuery;

const getRouteUseInfiniteQuery = (
  useInfiniteQueryFunction: UseInfiniteQueryFunction,
) => {
  return <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs,
  ) => {
    return (
      options: TanStackUseInfiniteQueryOptions<TAppRoute['responses']> & {
        requestMapper: (
          context: QueryFunctionContext,
        ) => ClientInferRequest<AppRouteMutation, ClientArgs>;
      },
    ) => {
      const { requestMapper, ...useInfiniteQueryOptions } = options;
      const dataFn: QueryFunction<
        TAppRoute['responses'],
        QueryKey,
        unknown
      > = async (context) => {
        const resultingQueryArgs = requestMapper(context);

        const innerDataFn = queryFn(route, clientArgs, resultingQueryArgs);

        return innerDataFn(undefined as any);
      };

      return useInfiniteQueryFunction({
        queryFn: dataFn,
        ...useInfiniteQueryOptions,
      });
    };
  };
};

const getRouteUseMutation = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (options?: TanStackUseMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args?: ClientInferRequest<AppRouteMutation, ClientArgs>,
    ) => {
      const dataFn = queryFn(route, clientArgs, args);

      return dataFn(undefined as any);
    };

    return useMutation({
      mutationFn: mutationFunction as () => Promise<
        ZodInferOrType<TAppRoute['responses']>
      >,
      ...options,
    });
  };
};

/** @deprecated Use `TsRestReactQueryClient` instead */
export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = UseTsRestQueryClient<T, TClientArgs>;

export type TsRestReactQueryClient<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<AppRouteFunctions<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? TsRestReactQueryClient<T[TKey], TClientArgs>
    : never;
};

const ClientParameters = Symbol('ClientParameters');

export const initQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  router: T,
  clientArgs: TClientArgs,
): TsRestReactQueryClient<T, TClientArgs> => {
  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
  ): TsRestReactQueryClient<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        if (isAppRoute(subRouter)) {
          return [
            key,
            {
              query: getRouteQuery(subRouter, clientArgs),
              mutation: getRouteQuery(subRouter, clientArgs),
              useQuery: getRouteUseQuery(useQuery)(subRouter, clientArgs),
              useSuspenseQuery: getRouteUseQuery(useSuspenseQuery)(
                subRouter,
                clientArgs,
              ),
              useQueries: getRouteUseQueries(useQueries)(subRouter, clientArgs),
              useSuspenseQueries: getRouteUseQueries(useSuspenseQueries)(
                subRouter,
                clientArgs,
              ),
              useInfiniteQuery: getRouteUseInfiniteQuery(useInfiniteQuery)(
                subRouter,
                clientArgs,
              ),
              useSuspenseInfiniteQuery: getRouteUseInfiniteQuery(
                useSuspenseInfiniteQuery,
              )(subRouter, clientArgs),
              useMutation: getRouteUseMutation(subRouter, clientArgs),
              fetchQuery: (
                queryClient: QueryClient,
                options: FetchQueryOptions<any> & {
                  request: ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => {
                const { request, ...fetchQueryOptions } = options;
                const dataFn = queryFn(subRouter, clientArgs, request);
                return queryClient.fetchQuery({
                  queryFn: dataFn,
                  ...fetchQueryOptions,
                });
              },
              fetchInfiniteQuery: (
                queryClient: QueryClient,
                options: FetchInfiniteQueryOptions<any> & {
                  requestMapper: (
                    context: QueryFunctionContext,
                  ) => ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => {
                const { requestMapper, ...fetchInfiniteQueryOptions } = options;
                return queryClient.fetchInfiniteQuery({
                  queryFn: async (context) => {
                    const resultingQueryArgs = requestMapper(context);

                    const innerDataFn = queryFn(
                      subRouter,
                      clientArgs,
                      resultingQueryArgs,
                    );

                    return innerDataFn(undefined as any);
                  },
                  ...fetchInfiniteQueryOptions,
                });
              },
              prefetchQuery: (
                queryClient: QueryClient,
                options: FetchQueryOptions<any> & {
                  request: ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => {
                const { request, ...fetchQueryOptions } = options;
                const dataFn = queryFn(subRouter, clientArgs, request);

                return queryClient.prefetchQuery({
                  queryFn: dataFn,
                  ...fetchQueryOptions,
                });
              },
              prefetchInfiniteQuery: (
                queryClient: QueryClient,
                options: FetchInfiniteQueryOptions<any> & {
                  requestMapper: (
                    context: QueryFunctionContext,
                  ) => ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => {
                const { requestMapper, ...fetchInfiniteQueryOptions } = options;
                return queryClient.prefetchInfiniteQuery({
                  queryFn: async (context) => {
                    const resultingQueryArgs = requestMapper(context);

                    const innerDataFn = queryFn(
                      subRouter,
                      clientArgs,
                      resultingQueryArgs,
                    );

                    return innerDataFn(undefined as any);
                  },
                  ...fetchInfiniteQueryOptions,
                });
              },
              getQueryData: (queryClient: QueryClient, queryKey: QueryKey) => {
                return queryClient.getQueryData(queryKey);
              },
              ensureQueryData: (
                queryClient: QueryClient,
                options: FetchQueryOptions<any> & {
                  request: ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => {
                const { request, ...fetchQueryOptions } = options;
                const dataFn = queryFn(subRouter, clientArgs, request);

                return queryClient.ensureQueryData({
                  queryFn: dataFn,
                  ...fetchQueryOptions,
                });
              },
              getQueriesData: (
                queryClient: QueryClient,
                filters: QueryFilters,
              ) => {
                return queryClient.getQueriesData(filters);
              },
              setQueryData: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                updater: any,
              ) => {
                return queryClient.setQueryData(queryKey, updater);
              },
            },
          ];
        } else {
          return [key, recursiveInit(subRouter)];
        }
      }),
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

export type UseTsRestQueryClient<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<AppRouteFunctionsWithQueryClient<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? UseTsRestQueryClient<T[TKey], TClientArgs>
    : never;
};

export const useTsRestQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  client: TsRestReactQueryClient<T, TClientArgs>,
): UseTsRestQueryClient<T, TClientArgs> => {
  // @ts-expect-error - hidden symbol, so we can refetch the original client router and clientArgs
  const { router } = client[ClientParameters] as unknown as {
    router: T;
    clientArgs: TClientArgs;
  };

  const queryClient = useQueryClient();

  const recursiveInit = <TInner extends AppRouter>(
    innerRouter: TInner,
    innerClient: TsRestReactQueryClient<TInner, TClientArgs>,
  ): UseTsRestQueryClient<TInner, TClientArgs> => {
    return Object.fromEntries(
      Object.entries(innerRouter).map(([key, subRouter]) => {
        if (isAppRoute(subRouter)) {
          type TSubRouter = typeof subRouter;
          const routeFunctions = innerClient[key] as AppRouteFunctions<
            TSubRouter,
            TClientArgs
          >;

          return [
            key,
            {
              ...routeFunctions,
              fetchQuery: (
                options: FetchQueryOptions<any> & {
                  request: ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => routeFunctions.fetchQuery(queryClient, options as any),
              fetchInfiniteQuery: (
                options: FetchInfiniteQueryOptions<any> & {
                  requestMapper: (
                    context: QueryFunctionContext,
                  ) => ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) =>
                routeFunctions.fetchInfiniteQuery(queryClient, options as any),
              prefetchQuery: (
                options: FetchQueryOptions<any> & {
                  request: ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => routeFunctions.prefetchQuery(queryClient, options as any),
              prefetchInfiniteQuery: (
                options: FetchInfiniteQueryOptions<any> & {
                  requestMapper: (
                    context: QueryFunctionContext,
                  ) => ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) =>
                routeFunctions.prefetchInfiniteQuery(
                  queryClient,
                  options as any,
                ),
              getQueryData: (queryKey: QueryKey) =>
                routeFunctions.getQueryData(queryClient, queryKey),
              ensureQueryData: (
                options: FetchQueryOptions<any> & {
                  request: ClientInferRequest<AppRouteMutation, ClientArgs>;
                },
              ) => routeFunctions.ensureQueryData(queryClient, options as any),
              getQueriesData: (filters: QueryFilters) =>
                routeFunctions.getQueriesData(queryClient, filters),
              setQueryData: (queryKey: QueryKey, updater: any) =>
                routeFunctions.setQueryData(queryClient, queryKey, updater),
            },
          ];
        } else {
          return [key, recursiveInit(subRouter, innerClient[key] as any)];
        }
      }),
    );
  };

  return useMemo(() => recursiveInit(router, client), [client]);
};
