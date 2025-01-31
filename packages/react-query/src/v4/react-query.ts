import {
  FetchQueryOptions,
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
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouteMutation,
  AppRouter,
  ClientInferRequest,
  evaluateFetchApiArgs,
  fetchApi,
  getRouteQuery,
  isAppRoute,
  isErrorResponse,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import { useMemo } from 'react';
import {
  AppRouteFunctions,
  AppRouteFunctionsWithQueryClient,
  DataReturnQueries,
} from './inner-types';
import { ReactQueryClientArgs } from './types';

const queryFn = <
  TAppRoute extends AppRoute,
  TClientArgs extends ReactQueryClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  args?: ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
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
    if (isErrorResponse(result)) {
      throw result;
    }

    return result;
  };
};

const getRouteUseQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ReactQueryClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (
    queryKey: QueryKey,
    args?: ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
    options?: TanStackUseQueryOptions<TAppRoute['responses']>,
  ) => {
    const dataFn = queryFn(route, clientArgs, args);

    return useQuery({ queryKey, queryFn: dataFn, ...options });
  };
};

const getRouteUseQueries = <
  TAppRoute extends AppRoute,
  TClientArgs extends ReactQueryClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
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
  TClientArgs extends ReactQueryClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (
    queryKey: QueryKey,
    argsMapper: (
      context: QueryFunctionContext,
    ) => ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
    options?: TanStackUseInfiniteQueryOptions<TAppRoute['responses']>,
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (context) => {
      const resultingQueryArgs = argsMapper(context);

      const innerDataFn = queryFn(route, clientArgs, resultingQueryArgs);

      return innerDataFn(undefined as any);
    };

    return useInfiniteQuery({ queryKey, queryFn: dataFn, ...options });
  };
};

const getRouteUseMutation = <
  TAppRoute extends AppRoute,
  TClientArgs extends ReactQueryClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (options?: TanStackUseMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args?: ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
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
  TClientArgs extends ReactQueryClientArgs,
> = UseTsRestQueryClient<T, TClientArgs>;

export type TsRestReactQueryClient<
  T extends AppRouter,
  TClientArgs extends ReactQueryClientArgs,
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
  TClientArgs extends ReactQueryClientArgs,
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
              useQuery: getRouteUseQuery(subRouter, clientArgs),
              useQueries: getRouteUseQueries(subRouter, clientArgs),
              useInfiniteQuery: getRouteUseInfiniteQuery(subRouter, clientArgs),
              useMutation: getRouteUseMutation(subRouter, clientArgs),
              fetchQuery: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                args: ClientInferRequest<
                  AppRouteMutation,
                  ReactQueryClientArgs
                >,
                options?: FetchQueryOptions<any>,
              ) => {
                const dataFn = queryFn(subRouter, clientArgs, args);
                return queryClient.fetchQuery({
                  queryKey,
                  queryFn: dataFn,
                  ...options,
                });
              },
              fetchInfiniteQuery: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                argsMapper: (
                  context: QueryFunctionContext,
                ) => ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
                options?: FetchQueryOptions<any>,
              ) => {
                return queryClient.fetchInfiniteQuery({
                  queryKey,
                  queryFn: async (context) => {
                    const resultingQueryArgs = argsMapper(context);

                    const innerDataFn = queryFn(
                      subRouter,
                      clientArgs,
                      resultingQueryArgs,
                    );

                    return innerDataFn(undefined as any);
                  },
                  ...options,
                });
              },
              prefetchQuery: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                args: ClientInferRequest<
                  AppRouteMutation,
                  ReactQueryClientArgs
                >,
                options?: FetchQueryOptions<any>,
              ) => {
                const dataFn = queryFn(subRouter, clientArgs, args);

                return queryClient.prefetchQuery({
                  queryKey,
                  queryFn: dataFn,
                  ...options,
                });
              },
              prefetchInfiniteQuery: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                argsMapper: (
                  context: QueryFunctionContext,
                ) => ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
                options?: FetchQueryOptions<any>,
              ) => {
                return queryClient.prefetchInfiniteQuery({
                  queryKey,
                  queryFn: async (context) => {
                    const resultingQueryArgs = argsMapper(context);

                    const innerDataFn = queryFn(
                      subRouter,
                      clientArgs,
                      resultingQueryArgs,
                    );

                    return innerDataFn(undefined as any);
                  },
                  ...options,
                });
              },
              getQueryData: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                filters?: QueryFilters,
              ) => {
                return queryClient.getQueryData(queryKey, filters);
              },
              ensureQueryData: (
                queryClient: QueryClient,
                queryKey: QueryKey,
                args: ClientInferRequest<
                  AppRouteMutation,
                  ReactQueryClientArgs
                >,
                options?: FetchQueryOptions<any>,
              ) => {
                const dataFn = queryFn(subRouter, clientArgs, args);

                return queryClient.ensureQueryData({
                  queryKey,
                  queryFn: dataFn,
                  ...options,
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
  TClientArgs extends ReactQueryClientArgs,
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<AppRouteFunctionsWithQueryClient<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? UseTsRestQueryClient<T[TKey], TClientArgs>
    : never;
};

export const useTsRestQueryClient = <
  T extends AppRouter,
  TClientArgs extends ReactQueryClientArgs,
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
                queryKey: QueryKey,
                args: ClientInferRequest<
                  AppRouteMutation,
                  ReactQueryClientArgs
                >,
                options?: FetchQueryOptions<any>,
              ) =>
                routeFunctions.fetchQuery(
                  queryClient,
                  queryKey,
                  args as any,
                  options,
                ),
              fetchInfiniteQuery: (
                queryKey: QueryKey,
                argsMapper: (
                  context: QueryFunctionContext,
                ) => ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
                options?: FetchQueryOptions<any>,
              ) =>
                routeFunctions.fetchInfiniteQuery(
                  queryClient,
                  queryKey,
                  argsMapper as any,
                  options,
                ),
              prefetchQuery: (
                queryKey: QueryKey,
                args: ClientInferRequest<
                  AppRouteMutation,
                  ReactQueryClientArgs
                >,
                options?: FetchQueryOptions<any>,
              ) =>
                routeFunctions.prefetchQuery(
                  queryClient,
                  queryKey,
                  args as any,
                  options,
                ),
              prefetchInfiniteQuery: (
                queryKey: QueryKey,
                argsMapper: (
                  context: QueryFunctionContext,
                ) => ClientInferRequest<AppRouteMutation, ReactQueryClientArgs>,
                options?: FetchQueryOptions<any>,
              ) =>
                routeFunctions.prefetchInfiniteQuery(
                  queryClient,
                  queryKey,
                  argsMapper as any,
                  options,
                ),
              getQueryData: (queryKey: QueryKey, filters?: QueryFilters) =>
                routeFunctions.getQueryData(queryClient, queryKey, filters),
              ensureQueryData: (
                queryKey: QueryKey,
                args: ClientInferRequest<
                  AppRouteMutation,
                  ReactQueryClientArgs
                >,
                options?: FetchQueryOptions<any>,
              ) =>
                routeFunctions.ensureQueryData(
                  queryClient,
                  queryKey,
                  args as any,
                  options,
                ),
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
