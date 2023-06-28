import type {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  MutationOptions,
  UseInfiniteQueryOptions,
  QueryOptions,
  UseQueryReturnType,
  UseMutationReturnType,
} from '@tanstack/vue-query';
import { useMutation, useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  ClientInferRequest,
  ClientInferResponses,
  ErrorHttpStatusCode,
  fetchApi,
  getCompleteUrl,
  getRouteQuery,
  isAppRoute,
  PartialClientInferRequest,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';

// Data response if it's a 2XX
type DataResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  SuccessfulHttpStatusCode,
  'force'
>;

// Error response if it's not a 2XX
type ErrorResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  ErrorHttpStatusCode,
  'ignore'
>;

// Used pn X.useMutation
type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  options?: MutationOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    PartialClientInferRequest<TAppRoute, TClientArgs>,
    unknown
  >
) => UseMutationReturnType<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  PartialClientInferRequest<TAppRoute, TClientArgs>,
  unknown
>;

// Used on X.useInfiniteQuery
type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  queryKey: QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>
  ) => PartialClientInferRequest<TAppRoute, TClientArgs>,
  options?: UseInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >
) => UseInfiniteQueryOptions<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

// Used on X.useQuery
type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  queryKey: QueryKey,
  args?: PartialClientInferRequest<TAppRoute, TClientArgs> | null,
  options?: QueryOptions<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>
) => UseQueryReturnType<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

type UseQueryArgs<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = {
  useQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute, TClientArgs>
    : never;
  useInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute, TClientArgs>
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

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

const getRouteUseQuery =
  <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs
  ) =>
  (
    queryKey: QueryKey,
    args?: ClientInferRequest<AppRouteMutation, ClientArgs> | null,
    options?: QueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async ({
      signal,
    }) => {
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
        signal,
        extraInputArgs,
      });

      // If the response is not a 2XX, throw an error to be handled by vue-query
      if (!String(result.status).startsWith('2')) throw result;

      return result;
    };

    return useQuery(queryKey, dataFn, options);
  };

const getRouteUseInfiniteQuery =
  <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs
  ) =>
  (
    queryKey: QueryKey,
    args?: (
      context: QueryFunctionContext
    ) => ClientInferRequest<AppRouteMutation, ClientArgs>,
    options?: UseInfiniteQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (
      infiniteQueryParams
    ) => {
      const resultingQueryArgs = args
        ? args(infiniteQueryParams)
        : ({} as ClientInferRequest<AppRouteMutation, ClientArgs>);

      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        resultingQueryArgs || {};

      const path = getCompleteUrl(
        query,
        clientArgs.baseUrl,
        params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        signal: infiniteQueryParams.signal,
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

      // If the response is not a 2XX, throw an error to be handled by vue-query
      if (!String(result.status).startsWith('2')) throw result;

      return result;
    };

    return useInfiniteQuery(queryKey, dataFn, options);
  };

const getRouteUseMutation =
  <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs
  ) =>
  (options?: MutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args?: ClientInferRequest<AppRouteMutation, ClientArgs>
    ) => {
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

      // If the response is not a 2XX, throw an error to be handled by vue-query
      if (!String(result.status).startsWith('2')) throw result;

      return result;
    };

    return useMutation(
      mutationFunction as () => Promise<ZodInferOrType<TAppRoute['responses']>>,
      options
    );
  };

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs
> = RecursiveProxyObj<T, TClientArgs>;

export const initQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs
>(
  router: T,
  args: TClientArgs
): InitClientReturn<T, TClientArgs> =>
  Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) =>
      isAppRoute(subRouter)
        ? [
            key,
            {
              query: getRouteQuery(subRouter, args),
              mutation: getRouteQuery(subRouter, args),
              useQuery: getRouteUseQuery(subRouter, args),
              useInfiniteQuery: getRouteUseInfiniteQuery(subRouter, args),
              useMutation: getRouteUseMutation(subRouter, args),
            },
          ]
        : [key, initQueryClient(subRouter, args)]
    )
  );
