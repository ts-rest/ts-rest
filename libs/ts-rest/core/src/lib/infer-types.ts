import {
  AppRoute,
  AppRouteMutation,
  AppRouter,
  AppRouteStrictStatusCodes,
} from './dsl';
import { HTTPStatusCode } from './status-codes';
import {
  LowercaseKeys,
  Prettify,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from './type-utils';
import { PathParamsWithCustomValidators } from './client';

type AppRouteResponses<
  T extends AppRoute,
  TStatus extends HTTPStatusCode,
  TClientOrServer extends 'client' | 'server'
> =
  | {
      [K in keyof T['responses'] & TStatus]: {
        status: K;
        body: TClientOrServer extends 'server'
          ? ZodInputOrType<T['responses'][K]>
          : ZodInferOrType<T['responses'][K]>;
      };
    }[keyof T['responses'] & TStatus]
  | (T extends AppRouteStrictStatusCodes
      ? never
      : Exclude<TStatus, keyof T['responses']> extends never
      ? never
      : { status: Exclude<TStatus, keyof T['responses']>; body: unknown });

export type ServerInferResponses<
  T extends AppRoute | AppRouter,
  TStatus extends HTTPStatusCode = HTTPStatusCode
> = T extends AppRoute
  ? Prettify<AppRouteResponses<T, TStatus, 'server'>>
  : T extends AppRouter
  ? { [TKey in keyof T]: ServerInferResponses<T[TKey], TStatus> }
  : never;

export type ClientInferResponses<
  T extends AppRoute | AppRouter,
  TStatus extends HTTPStatusCode = HTTPStatusCode
> = T extends AppRoute
  ? Prettify<AppRouteResponses<T, TStatus, 'client'>>
  : T extends AppRouter
  ? { [TKey in keyof T]: ClientInferResponses<T[TKey], TStatus> }
  : never;

export type ServerInferResponseBody<
  T extends AppRoute,
  TStatus extends keyof T['responses'] = keyof T['responses']
> = Prettify<AppRouteResponses<T, TStatus & HTTPStatusCode, 'server'>['body']>;

export type ClientInferResponseBody<
  T extends AppRoute,
  TStatus extends keyof T['responses'] = keyof T['responses']
> = Prettify<AppRouteResponses<T, TStatus & HTTPStatusCode, 'client'>['body']>;

type BodyWithoutFileIfMultiPart<T extends AppRouteMutation> = Prettify<
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>
>;

export type ServerInferRequest<T extends AppRoute | AppRouter> =
  T extends AppRoute
    ? Prettify<
        Without<
          {
            params: [undefined] extends PathParamsWithCustomValidators<T>
              ? never
              : Prettify<PathParamsWithCustomValidators<T>>;
            body: T extends AppRouteMutation
              ? BodyWithoutFileIfMultiPart<T>
              : never;
            query: 'query' extends keyof T ? ZodInferOrType<T['query']> : never;
            headers: 'headers' extends keyof T
              ? Prettify<LowercaseKeys<ZodInferOrType<T['headers']>>>
              : never;
          },
          never
        >
      >
    : T extends AppRouter
    ? { [TKey in keyof T]: ServerInferRequest<T[TKey]> }
    : never;

export type ClientInferRequest<T extends AppRoute | AppRouter> =
  T extends AppRoute
    ? Prettify<
        Without<
          {
            params: [undefined] extends PathParamsWithCustomValidators<
              T,
              'client'
            >
              ? never
              : Prettify<PathParamsWithCustomValidators<T, 'client'>>;
            body: T extends AppRouteMutation
              ? T['contentType'] extends 'multipart/form-data'
                ? FormData | ZodInputOrType<T['body']>
                : ZodInputOrType<T['body']>
              : never;
            query: 'query' extends keyof T ? ZodInputOrType<T['query']> : never;
            headers: 'headers' extends keyof T
              ? Prettify<LowercaseKeys<ZodInputOrType<T['headers']>>>
              : never;
          },
          never
        >
      >
    : T extends AppRouter
    ? { [TKey in keyof T]: ClientInferRequest<T[TKey]> }
    : never;
