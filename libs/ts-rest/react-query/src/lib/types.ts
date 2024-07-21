import {
  UseInfiniteQueryOptions as TanStackUseInfiniteQueryOptions,
  UseInfiniteQueryResult as TanStackUseInfiniteQueryResult,
  UseMutationOptions as TanStackUseMutationOptions,
  UseMutationResult as TanStackUseMutationResult,
  UseQueryOptions as TanStackUseQueryOptions,
  UseQueryResult as TanStackUseQueryResult,
  UseSuspenseQueryOptions as TanStackUseSuspenseQueryOptions,
  UseSuspenseQueryResult as TanStackUseSuspenseQueryResult,
  UseSuspenseInfiniteQueryOptions as TanStackUseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult as TanStackUseSuspenseInfiniteQueryResult,
} from '@tanstack/react-query';
import {
  AppRoute,
  ClientArgs,
  ClientInferResponses,
  ErrorHttpStatusCode,
  PartialClientInferRequest,
  SuccessfulHttpStatusCode,
} from '@ts-rest/core';
import { InitClientReturn } from './react-query';

// Data response if it's a 2XX
export type DataResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  SuccessfulHttpStatusCode,
  'force'
>;

// Error response if it's not a 2XX
export type ErrorResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  ErrorHttpStatusCode,
  'ignore'
>;

export type UseQueryOptions<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = Omit<
  TanStackUseQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TData
  >,
  'queryFn'
>;

export type UseSuspenseQueryOptions<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = Omit<
  TanStackUseSuspenseQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TData
  >,
  'queryFn'
>;

export type UseQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = TanStackUseQueryResult<TData, ErrorResponse<TAppRoute>>;

export type UseSuspenseQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = TanStackUseSuspenseQueryResult<TData, ErrorResponse<TAppRoute>>;

export type UseInfiniteQueryOptions<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = Omit<
  TanStackUseInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TData
  >,
  'queryFn'
>;

export type UseSuspenseInfiniteQueryOptions<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = Omit<
  TanStackUseSuspenseInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    TData
  >,
  'queryFn'
>;

export type UseInfiniteQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = TanStackUseInfiniteQueryResult<TData, ErrorResponse<TAppRoute>>;

export type UseSuspenseInfiniteQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
> = TanStackUseSuspenseInfiniteQueryResult<TData, ErrorResponse<TAppRoute>>;

type InferClientArgs<TClient extends InitClientReturn<any, any>> =
  TClient extends InitClientReturn<any, infer TClientArgs>
    ? TClientArgs
    : never;

export type UseMutationOptions<
  TAppRoute extends AppRoute,
  TClientArgsOrClient extends ClientArgs | InitClientReturn<any, any>,
> = TanStackUseMutationOptions<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  TClientArgsOrClient extends ClientArgs
    ? PartialClientInferRequest<TAppRoute, TClientArgsOrClient>
    : TClientArgsOrClient extends InitClientReturn<any, any>
    ? PartialClientInferRequest<TAppRoute, InferClientArgs<TClientArgsOrClient>>
    : never,
  unknown
>;

export type UseMutationResult<
  TAppRoute extends AppRoute,
  TClientArgsOrClient extends ClientArgs | InitClientReturn<any, any>,
> = TanStackUseMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  TClientArgsOrClient extends ClientArgs
    ? PartialClientInferRequest<TAppRoute, TClientArgsOrClient>
    : TClientArgsOrClient extends InitClientReturn<any, any>
    ? PartialClientInferRequest<TAppRoute, InferClientArgs<TClientArgsOrClient>>
    : never,
  unknown
>;
