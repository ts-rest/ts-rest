import {
  AppRoute,
  AppRouteDeleteNoBody,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  ClientInferResponses,
  ErrorHttpStatusCode,
  PartialClientInferRequest,
  SuccessfulHttpStatusCode,
} from '@ts-rest/core';
import { QueryClient } from '@tanstack/react-query';
import { MutationHooks, QueryHooks } from './hooks';
import { TsRestQueryClientFunctions } from './query-client-functions';

export type DataResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  SuccessfulHttpStatusCode,
  'force'
>;

export type ErrorResponse<TAppRoute extends AppRoute> =
  | ClientInferResponses<TAppRoute, ErrorHttpStatusCode, 'ignore'>
  | Error;

// TODO: in v4 remove Omit after `cache` and `next` are removed. they are removed here because this is a new library
export type RequestData<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = Omit<PartialClientInferRequest<TAppRoute, TClientArgs>, 'cache' | 'next'>;

export type TsRestReactQueryHooksContainer<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? T[TKey] extends AppRouteQuery
      ? QueryHooks<T[TKey], TClientArgs>
      : T[TKey] extends AppRouteMutation | AppRouteDeleteNoBody
      ? MutationHooks<T[TKey], TClientArgs>
      : never
    : T[TKey] extends AppRouter
    ? TsRestReactQueryHooksContainer<T[TKey], TClientArgs>
    : never;
};

export type TsRestReactQueryClientFunctionsContainer<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? T[TKey] extends AppRouteQuery
      ? TsRestQueryClientFunctions<T[TKey], TClientArgs>
      : never
    : T[TKey] extends AppRouter
    ? TsRestReactQueryClientFunctionsContainer<T[TKey], TClientArgs>
    : never;
};

export type TsRestReactQueryClient<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = QueryClient & TsRestReactQueryClientFunctionsContainer<T, TClientArgs>;

export type ClientOptions = ClientArgs;

export type InferClientArgs<
  TClient extends TsRestReactQueryHooksContainer<any, any>,
> = TClient extends TsRestReactQueryHooksContainer<any, infer TClientArgs>
  ? TClientArgs
  : never;
