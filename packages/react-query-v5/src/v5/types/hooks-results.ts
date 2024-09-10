import { AppRoute, ClientArgs } from '@ts-rest/core';
import {
  InfiniteData,
  UseQueryResult as TanStackUseQueryResult,
  DefinedUseQueryResult as TanstackDefinedUseQueryResult,
  UseSuspenseQueryResult as TanStackUseSuspenseQueryResult,
  UseInfiniteQueryResult as TanStackUseInfiniteQueryResult,
  DefinedUseInfiniteQueryResult as TanstackDefinedUseInfiniteQueryResult,
  UseSuspenseInfiniteQueryResult as TanStackUseSuspenseInfiniteQueryResult,
  UseMutationResult as TanStackUseMutationResult,
} from '@tanstack/react-query';
import { QueriesResults } from '../internal/queries-options';
import { SuspenseQueriesResults } from '../internal/suspense-queries-options';
import { DataResponse, ErrorResponse, RequestData } from './common';

export type TsRestResult<TAppRoute extends AppRoute> = {
  contractEndpoint: TAppRoute;
};

export type UseQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> = TanStackUseQueryResult<TData, TError> & TsRestResult<TAppRoute>;

export type DefinedUseQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> = TanstackDefinedUseQueryResult<TData, TError> & TsRestResult<TAppRoute>;

export type UseSuspenseQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> = TanStackUseSuspenseQueryResult<TData, TError> & TsRestResult<TAppRoute>;

export type UseQueriesResult<
  TAppRoute extends AppRoute,
  TQueries extends Array<any>,
> = QueriesResults<TAppRoute, TQueries>;

export type UseSuspenseQueriesResult<
  TAppRoute extends AppRoute,
  TQueries extends Array<any>,
> = SuspenseQueriesResults<TAppRoute, TQueries>;

export type UseInfiniteQueryResult<
  TAppRoute extends AppRoute,
  TData = InfiniteData<DataResponse<TAppRoute>>,
  TError = ErrorResponse<TAppRoute>,
> = TanStackUseInfiniteQueryResult<TData, TError> & TsRestResult<TAppRoute>;

export type DefinedUseInfiniteQueryResult<
  TAppRoute extends AppRoute,
  TData = InfiniteData<DataResponse<TAppRoute>>,
  TError = ErrorResponse<TAppRoute>,
> = TanstackDefinedUseInfiniteQueryResult<TData, TError> &
  TsRestResult<TAppRoute>;

export type UseSuspenseInfiniteQueryResult<
  TAppRoute extends AppRoute,
  TData = InfiniteData<DataResponse<TAppRoute>>,
  TError = ErrorResponse<TAppRoute>,
> = TanStackUseSuspenseInfiniteQueryResult<TData, TError> &
  TsRestResult<TAppRoute>;

export type UseMutationResult<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
  TVariables = RequestData<TAppRoute, TClientArgs>,
  TContext = unknown,
> = TanStackUseMutationResult<TData, TError, TVariables, TContext> &
  TsRestResult<TAppRoute>;
