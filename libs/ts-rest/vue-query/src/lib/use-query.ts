import {
  useQuery,
  type QueryKey,
  type UseQueryReturnType,
  UseQueryOptions,
  QueryFunctionContext,
} from '@tanstack/vue-query';
import {
  AppRoute,
  AppRouteMutation,
  AreAllPropertiesOptional,
  ClientArgs,
  ClientInferRequest,
  PartialClientInferRequest,
} from '@ts-rest/core';
import { DataResponse, ErrorResponse, queryFn } from './common';

// Used on X.useQuery
export type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TAppRoute, TClientArgs>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: (context: QueryFunctionContext<QueryKey>) => TArgs,
      options?: UseQueryOptions<TAppRoute>
    ) => UseQueryReturnType<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>
  : (
      queryKey: QueryKey,
      args: (context: QueryFunctionContext<QueryKey>) => TArgs,
      options?: UseQueryOptions<TAppRoute>
    ) => UseQueryReturnType<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

export const getRouteUseQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (
    queryKey: QueryKey,
    args?: (
      context: QueryFunctionContext<QueryKey>
    ) => ClientInferRequest<AppRouteMutation, ClientArgs>,
    options?: UseQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn = queryFn(route, clientArgs, args);

    return useQuery({ queryKey, queryFn: dataFn, ...options });
  };
};
