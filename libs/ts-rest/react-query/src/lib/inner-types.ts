import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AreAllPropertiesOptional,
  ClientArgs,
  PartialClientInferRequest,
} from '@ts-rest/core';
import {
  DataResponse,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from './types';
import {
  FetchQueryOptions,
  InfiniteData,
  QueryClient,
  QueryFilters,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/react-query';

export type AppRouteFunctions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
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

export type AppRouteFunctionsWithQueryClient<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = AppRouteFunctions<TAppRoute, TClientArgs> & {
  fetchQuery: TAppRoute extends AppRouteQuery
    ? DataReturnFetchQueryHook<TAppRoute, TClientArgs>
    : never;
  fetchInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnFetchInfiniteQueryHook<TAppRoute, TClientArgs>
    : never;
  prefetchQuery: TAppRoute extends AppRouteQuery
    ? DataReturnPrefetchQueryHook<TAppRoute, TClientArgs>
    : never;
  prefetchInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnPrefetchInfiniteQueryHook<TAppRoute, TClientArgs>
    : never;
  getQueryData: TAppRoute extends AppRouteQuery
    ? DataReturnGetQueryDataHook<TAppRoute>
    : never;
  ensureQueryData: TAppRoute extends AppRouteQuery
    ? DataReturnFetchQueryHook<TAppRoute, TClientArgs>
    : never;
  getQueriesData: TAppRoute extends AppRouteQuery
    ? DataReturnGetQueriesDataHook<TAppRoute>
    : never;
  setQueryData: TAppRoute extends AppRouteQuery
    ? DataReturnSetQueryDataHook<TAppRoute>
    : never;
};

// Used on X.useQuery
export type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: UseQueryOptions<TAppRoute>,
    ) => UseQueryResult<TAppRoute>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: UseQueryOptions<TAppRoute>,
    ) => UseQueryResult<TAppRoute>;

export type DataReturnQueriesOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = PartialClientInferRequest<TAppRoute, TClientArgs> &
  Omit<UseQueryOptions<TAppRoute>, 'queryFn'> & {
    queryKey: QueryKey;
  };

export type DataReturnQueries<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueries = readonly DataReturnQueriesOptions<TAppRoute, TClientArgs>[],
> = (args: {
  queries: TQueries;
  context?: UseQueryOptions<TAppRoute>['context'];
}) => UseQueryResult<TAppRoute>[];

// Used on X.useInfiniteQuery
export type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = (
  queryKey: QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>,
  ) => PartialClientInferRequest<TAppRoute, TClientArgs>,
  options?: UseInfiniteQueryOptions<TAppRoute>,
) => UseInfiniteQueryResult<TAppRoute>;

// Used pn X.useMutation
export type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = (
  options?: UseMutationOptions<TAppRoute, TClientArgs>,
) => UseMutationResult<TAppRoute, TClientArgs>;

export type DataReturnFetchQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryClient: QueryClient,
      queryKey: QueryKey,
      args?: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<DataResponse<TAppRoute>>
  : (
      queryClient: QueryClient,
      queryKey: QueryKey,
      args: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<DataResponse<TAppRoute>>;

export type DataReturnFetchQueryHook<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<DataResponse<TAppRoute>>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<DataResponse<TAppRoute>>;

export type DataReturnPrefetchQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryClient: QueryClient,
      queryKey: QueryKey,
      args?: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<void>
  : (
      queryClient: QueryClient,
      queryKey: QueryKey,
      args: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<void>;

export type DataReturnPrefetchQueryHook<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<void>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: FetchQueryOptions<TAppRoute>,
    ) => Promise<void>;

export type DataReturnFetchInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  args: (context: QueryFunctionContext) => TArgs,
  options?: FetchQueryOptions<TAppRoute>,
) => Promise<InfiniteData<DataResponse<TAppRoute>>>;

export type DataReturnFetchInfiniteQueryHook<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = (
  queryKey: QueryKey,
  args: (context: QueryFunctionContext) => TArgs,
  options?: FetchQueryOptions<TAppRoute>,
) => Promise<InfiniteData<DataResponse<TAppRoute>>>;

export type DataReturnPrefetchInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  args: (context: QueryFunctionContext) => TArgs,
  options?: FetchQueryOptions<TAppRoute>,
) => Promise<void>;

export type DataReturnPrefetchInfiniteQueryHook<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>,
> = (
  queryKey: QueryKey,
  args: (context: QueryFunctionContext) => TArgs,
  options?: FetchQueryOptions<TAppRoute>,
) => Promise<void>;

export type DataReturnGetQueryData<TAppRoute extends AppRoute> = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  filters?: QueryFilters,
) => DataResponse<TAppRoute> | undefined;

export type DataReturnGetQueryDataHook<TAppRoute extends AppRoute> = (
  queryKey: QueryKey,
  filters?: QueryFilters,
) => DataResponse<TAppRoute> | undefined;

export type DataReturnGetQueriesData<TAppRoute extends AppRoute> = (
  queryClient: QueryClient,
  filters: QueryFilters,
) => [queryKey: QueryKey, data: DataResponse<TAppRoute> | undefined][];

export type DataReturnGetQueriesDataHook<TAppRoute extends AppRoute> = (
  filters: QueryFilters,
) => [queryKey: QueryKey, data: DataResponse<TAppRoute> | undefined][];

export type DataReturnSetQueryData<TAppRoute extends AppRoute> = (
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater:
    | DataResponse<TAppRoute>
    | undefined
    | ((
        oldData: DataResponse<TAppRoute> | undefined,
      ) => DataResponse<TAppRoute> | undefined),
) => DataResponse<TAppRoute> | undefined;

export type DataReturnSetQueryDataHook<TAppRoute extends AppRoute> = (
  queryKey: QueryKey,
  updater:
    | DataResponse<TAppRoute>
    | undefined
    | ((
        oldData: DataResponse<TAppRoute> | undefined,
      ) => DataResponse<TAppRoute> | undefined),
) => DataResponse<TAppRoute> | undefined;
