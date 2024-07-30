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
  ClientInferResponses,
  ErrorHttpStatusCode,
  PartialClientInferRequest,
  SuccessfulHttpStatusCode,
} from '@ts-rest/core';
import { TsRestReactQueryClient } from './react-query';

export interface ReactQueryClientArgs extends ClientArgs {
  includeThrownErrorsInErrorType?: boolean;
}

// Data response if it's a 2XX
export type DataResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  SuccessfulHttpStatusCode,
  'force'
>;

// Error response if it's not a 2XX
export type ErrorResponse<
  TAppRoute extends AppRoute,
  TIncludeThrownErrors extends boolean | undefined = false,
> =
  | ClientInferResponses<TAppRoute, ErrorHttpStatusCode, 'ignore'>
  | (TIncludeThrownErrors extends true ? Error : never);

export type UseQueryOptions<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TIncludeThrownErrors extends boolean | undefined = false,
> = TanStackUseQueryOptions<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute, TIncludeThrownErrors>,
  TData
>;

export type UseQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TIncludeThrownErrors extends boolean | undefined = false,
> = TanStackUseQueryResult<
  TData,
  ErrorResponse<TAppRoute, TIncludeThrownErrors>
>;

export type UseInfiniteQueryOptions<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TIncludeThrownErrors extends boolean | undefined = false,
> = TanStackUseInfiniteQueryOptions<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute, TIncludeThrownErrors>,
  TData
>;

export type UseInfiniteQueryResult<
  TAppRoute extends AppRoute,
  TData = DataResponse<TAppRoute>,
  TIncludeThrownErrors extends boolean | undefined = false,
> = TanStackUseInfiniteQueryResult<
  TData,
  ErrorResponse<TAppRoute, TIncludeThrownErrors>
>;

type InferClientArgs<TClient extends TsRestReactQueryClient<any, any>> =
  TClient extends TsRestReactQueryClient<any, infer TClientArgs>
    ? TClientArgs
    : never;

type GetClientArgs<
  TClientArgsOrClient extends
    | ReactQueryClientArgs
    | TsRestReactQueryClient<any, any>,
> = TClientArgsOrClient extends ReactQueryClientArgs
  ? TClientArgsOrClient
  : TClientArgsOrClient extends TsRestReactQueryClient<any, any>
  ? InferClientArgs<TClientArgsOrClient>
  : never;

export type UseMutationOptions<
  TAppRoute extends AppRoute,
  TClientArgsOrClient extends
    | ReactQueryClientArgs
    | TsRestReactQueryClient<any, any>,
  TClientArgs extends ReactQueryClientArgs = GetClientArgs<TClientArgsOrClient>,
> = TanStackUseMutationOptions<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute, TClientArgs['includeThrownErrorsInErrorType']>,
  PartialClientInferRequest<TAppRoute, TClientArgs>,
  unknown
>;

export type UseMutationResult<
  TAppRoute extends AppRoute,
  TClientArgsOrClient extends
    | ReactQueryClientArgs
    | TsRestReactQueryClient<any, any>,
  TClientArgs extends ReactQueryClientArgs = GetClientArgs<TClientArgsOrClient>,
> = TanStackUseMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute, TClientArgs['includeThrownErrorsInErrorType']>,
  PartialClientInferRequest<TAppRoute, TClientArgs>,
  unknown
>;
