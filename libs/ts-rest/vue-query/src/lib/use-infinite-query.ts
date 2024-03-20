import { useInfiniteQuery } from '@tanstack/vue-query';
import type {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
} from '@tanstack/vue-query';
import {
  AppRoute,
  AppRouteMutation,
  ClientArgs,
  ClientInferRequest,
  PartialClientInferRequest,
} from '@ts-rest/core';
import { DataResponse, ErrorResponse, queryFn } from './common';

// Used on X.useInfiniteQuery
export type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = (
  queryKey: QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>,
  ) => PartialClientInferRequest<TAppRoute, TClientArgs>,
  options?: UseInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TAppRoute
  >,
) => UseInfiniteQueryReturnType<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>
>;

export const getRouteUseInfiniteQuery =
  <TAppRoute extends AppRoute, TClientArgs extends ClientArgs>(
    route: TAppRoute,
    clientArgs: TClientArgs,
  ) =>
  (
    queryKey: QueryKey,
    argsMapper: (
      context: QueryFunctionContext,
    ) => ClientInferRequest<AppRouteMutation, ClientArgs>,
    options?: UseInfiniteQueryOptions<TAppRoute['responses']>,
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (context) => {
      const resultingQueryArgs = argsMapper(context);

      const innerDataFn = queryFn(route, clientArgs, resultingQueryArgs);

      return innerDataFn(undefined as any);
    };

    return useInfiniteQuery({
      queryKey,
      queryFn: dataFn,
      ...options,
    });
  };
