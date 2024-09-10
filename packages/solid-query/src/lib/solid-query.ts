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
  ClientInferRequest,
  ClientInferResponses,
  ErrorHttpStatusCode,
  evaluateFetchApiArgs,
  fetchApi,
  getRouteQuery,
  isAppRoute,
  isErrorResponse,
  PartialClientInferRequest,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

type UseQueryArgs<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = {
  createQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute, TClientArgs>
    : never;
  createInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute, TClientArgs>
    : never;
  query: TAppRoute extends AppRouteQuery
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
  createMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute, TClientArgs>
    : never;
  mutation: TAppRoute extends AppRouteMutation
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
};

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

// Used on X.createQuery
type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = <TData = DataResponse<TAppRoute>>(
  queryKey: () => QueryKey,
  args: PartialClientInferRequest<TAppRoute, TClientArgs>,
  options?: CreateQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TData
  >,
) => CreateQueryResult<TData, ErrorResponse<TAppRoute>>;

// Used on X.useInfiniteQuery
type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = <TData = DataResponse<TAppRoute>>(
  queryKey: () => QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>,
  ) => PartialClientInferRequest<TAppRoute, TClientArgs>,
  options?: CreateInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TData
  >,
) => CreateInfiniteQueryResult<TData, ErrorResponse<TAppRoute>>;

// Used pn X.createMutation
type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = (
  options?: CreateMutationOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    PartialClientInferRequest<TAppRoute, TClientArgs>,
    unknown
  >,
) => CreateMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  PartialClientInferRequest<TAppRoute, TClientArgs>,
  unknown
>;

const getRouteUseQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (
    queryKey: () => QueryKey,
    args: ClientInferRequest<AppRouteMutation, ClientArgs>,
    options?: CreateQueryOptions<TAppRoute['responses']>,
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async ({
      signal,
    }) => {
      const fetchApiArgs = evaluateFetchApiArgs(route, clientArgs, args);
      const result = await fetchApi({
        ...fetchApiArgs,
        fetchOptions: {
          ...(signal && { signal }),
          ...fetchApiArgs.fetchOptions,
        },
      });

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (isErrorResponse(result)) {
        throw result;
      }

      return result;
    };

    return createQuery(queryKey, dataFn, options);
  };
};

const getRouteUseInfiniteQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (
    queryKey: () => QueryKey,
    args: (
      context: QueryFunctionContext,
    ) => ClientInferRequest<AppRouteMutation, ClientArgs>,
    options?: CreateInfiniteQueryOptions<TAppRoute['responses']>,
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (
      infiniteQueryParams,
    ) => {
      const resultingQueryArgs = args(infiniteQueryParams);

      const fetchApiArgs = evaluateFetchApiArgs(
        route,
        clientArgs,
        resultingQueryArgs,
      );
      const result = await fetchApi({
        ...fetchApiArgs,
        fetchOptions: {
          ...(infiniteQueryParams.signal && {
            signal: infiniteQueryParams.signal,
          }),
          ...fetchApiArgs.fetchOptions,
        },
      });

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (isErrorResponse(result)) {
        throw result;
      }

      return result;
    };

    return createInfiniteQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
) => {
  return (options?: CreateMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args: ClientInferRequest<AppRouteMutation, ClientArgs>,
    ) => {
      const fetchApiArgs = evaluateFetchApiArgs(route, clientArgs, args);
      const result = await fetchApi(fetchApiArgs);

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (isErrorResponse(result)) {
        throw result;
      }

      return result;
    };

    return createMutation(
      mutationFunction as () => Promise<ZodInferOrType<TAppRoute['responses']>>,
      options,
    );
  };
};

/** @deprecated Use `TsRestSolidQueryClient` instead */
export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = TsRestSolidQueryClient<T, TClientArgs>;

export type TsRestSolidQueryClient<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = RecursiveProxyObj<T, TClientArgs>;

export const initQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  router: T,
  args: TClientArgs,
): TsRestSolidQueryClient<T, TClientArgs> => {
  return Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) => {
      if (isAppRoute(subRouter)) {
        return [
          key,
          {
            query: getRouteQuery(subRouter, args),
            mutation: getRouteQuery(subRouter, args),
            createQuery: getRouteUseQuery(subRouter, args),
            createInfiniteQuery: getRouteUseInfiniteQuery(subRouter, args),
            createMutation: getRouteUseMutation(subRouter, args),
          },
        ];
      } else {
        return [key, initQueryClient(subRouter, args)];
      }
    }),
  );
};
