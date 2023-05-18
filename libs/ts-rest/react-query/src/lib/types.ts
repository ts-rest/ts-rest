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
  AppRouteMutation,
  ClientArgs,
  ExtractExtraParametersFromClientArgs,
  HTTPStatusCode,
  LowercaseKeys,
  OptionalIfAllOptional,
  PartialByLooseKeys,
  PathParamsFromUrl,
  Prettify,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from '@ts-rest/core';
import { z, ZodTypeAny } from 'zod';
import { InitClientReturn } from './react-query';

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.input<T> : T;

export type DataReturnArgsBase<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  THeaders = Prettify<
    'headers' extends keyof TRoute
      ? PartialByLooseKeys<
          LowercaseKeys<ZodInputOrType<TRoute['headers']>>,
          keyof LowercaseKeys<TClientArgs['baseHeaders']>
        >
      : never
  >
> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']> extends null
      ? never
      : AppRouteMutationType<TRoute['body']>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: 'query' extends keyof TRoute
    ? AppRouteMutationType<TRoute['query']> extends null
      ? never
      : AppRouteMutationType<TRoute['query']>
    : never;
  headers: THeaders;
  extraHeaders?: Record<string, string | undefined>;
} & ExtractExtraParametersFromClientArgs<TClientArgs>;

export type DataReturnArgs<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = OptionalIfAllOptional<DataReturnArgsBase<TRoute, TClientArgs>>;

/**
 * Split up the data and error to support react-query style
 * useQuery and useMutation error handling
 */
type SuccessResponseMapper<T> = {
  [K in keyof T]: K extends SuccessfulHttpStatusCode
    ? { status: K; body: ZodInferOrType<T[K]> }
    : never;
}[keyof T];

/**
 * Returns any handled errors, or any unhandled non success errors
 */
type ErrorResponseMapper<T> =
  | {
      [K in keyof T]: K extends SuccessfulHttpStatusCode
        ? never
        : { status: K; body: ZodInferOrType<T[K]> };
    }[keyof T]
  // If the response isn't one of our typed ones. Return "unknown"
  | {
      status: Exclude<HTTPStatusCode, keyof T | SuccessfulHttpStatusCode>;
      body: unknown;
    };

// Data response if it's a 2XX
export type DataResponse<TAppRoute extends AppRoute> = SuccessResponseMapper<
  TAppRoute['responses']
>;

// Error response if it's not a 2XX
export type ErrorResponse<TAppRoute extends AppRoute> = ErrorResponseMapper<
  TAppRoute['responses']
>;

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
  TClientArgsOrClient extends ClientArgs | InitClientReturn<any, any>
> = TanStackUseMutationOptions<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  TClientArgsOrClient extends ClientArgs
    ? Prettify<Without<DataReturnArgs<TAppRoute, TClientArgsOrClient>, never>>
    : TClientArgsOrClient extends InitClientReturn<any, any>
    ? Prettify<
        Without<
          DataReturnArgs<TAppRoute, InferClientArgs<TClientArgsOrClient>>,
          never
        >
      >
    : never,
  unknown
>;

export type UseMutationResult<
  TAppRoute extends AppRoute,
  TClientArgsOrClient extends ClientArgs | InitClientReturn<any, any>
> = TanStackUseMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  TClientArgsOrClient extends ClientArgs
    ? Prettify<Without<DataReturnArgs<TAppRoute, TClientArgsOrClient>, never>>
    : TClientArgsOrClient extends InitClientReturn<any, any>
    ? Prettify<
        Without<
          DataReturnArgs<TAppRoute, InferClientArgs<TClientArgsOrClient>>,
          never
        >
      >
    : never,
  unknown
>;
