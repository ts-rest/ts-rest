import {
  UseInfiniteQueryOptions as TanStackUseInfiniteQueryOptions,
  UseInfiniteQueryResult as TanStackUseInfiniteQueryResult,
  UseMutationOptions as TanStackUseMutationOptions,
  UseMutationResult as TanStackUseMutationResult,
  UseQueryOptions as TanStackUseQueryOptions,
  UseQueryResult as TanStackUseQueryResult,
} from '@tanstack/react-query';
import {
  AppRoute,
  ClientArgs,
  DataResponse as CoreDataResponse,
  ErrorResponse as CoreErrorResponse,
  PartialClientInferRequest,
} from '@ts-rest/core';
import { InitClientReturn } from './react-query';

// Data response if it's a 2XX
/** @deprecated use directly the `DataResponse` from @ts-rest/core */
export type DataResponse<TAppRoute extends AppRoute> =
  CoreDataResponse<TAppRoute>;

// Error response if it's not a 2XX
/** @deprecated use directly the `ErrorResponse` from @ts-rest/core */
export type ErrorResponse<TAppRoute extends AppRoute> =
  CoreErrorResponse<TAppRoute>;

export type UseQueryOptions<TAppRoute extends AppRoute> =
  TanStackUseQueryOptions<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

export type UseQueryResult<TAppRoute extends AppRoute> = TanStackUseQueryResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>
>;

export type UseInfiniteQueryOptions<TAppRoute extends AppRoute> =
  TanStackUseInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >;

export type UseInfiniteQueryResult<TAppRoute extends AppRoute> =
  TanStackUseInfiniteQueryResult<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >;

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
