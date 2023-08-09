import {
  AppRoute,
  AppRouteMutation,
  AppRouter,
  AppRouteStrictStatusCodes,
  ContractAnyType,
  ContractOtherResponse,
} from './dsl';
import { HTTPStatusCode } from './status-codes';
import {
  And,
  Extends,
  LowercaseKeys,
  Merge,
  Not,
  OptionalIfAllOptional,
  Or,
  PartialByLooseKeys,
  Prettify,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from './type-utils';
import { ApiFetcher, ClientArgs } from './client';
import { ParamsFromUrl } from './paths';

export type Frameworks = 'nextjs' | 'none';

export type NextClientArgs = {
  next?: { revalidate?: number | false, tags?: string[]} | undefined
}

type ExtractExtraParametersFromClientArgs<
  TClientArgs extends Pick<ClientArgs, 'api'>
> = TClientArgs['api'] extends ApiFetcher
  ? Omit<Parameters<TClientArgs['api']>[0], keyof Parameters<ApiFetcher>[0]>
  : {};

/**
 * Extract the path params from the path in the contract
 */
type PathParamsFromUrl<T extends AppRoute> = ParamsFromUrl<
  T['path']
> extends infer U
  ? U
  : never;

/**
 * Merge `PathParamsFromUrl<T>` with pathParams schema if it exists
 */
type PathParamsWithCustomValidators<
  T extends AppRoute,
  TClientOrServer extends 'client' | 'server' = 'server'
> = T['pathParams'] extends undefined
  ? PathParamsFromUrl<T>
  : Merge<
      PathParamsFromUrl<T>,
      TClientOrServer extends 'server'
        ? ZodInferOrType<T['pathParams']>
        : ZodInputOrType<T['pathParams']>
    >;

export type ResolveResponseType<
  T extends ContractAnyType | ContractOtherResponse<ContractAnyType>
> = T extends ContractOtherResponse<infer U> ? U : T;

type AppRouteResponses<
  T extends AppRoute,
  TStatus extends HTTPStatusCode,
  TClientOrServer extends 'client' | 'server',
  TStrictStatusCodes extends 'default' | 'ignore' | 'force' = 'default'
> =
  | {
      [K in keyof T['responses'] & TStatus]: {
        status: K;
        body: TClientOrServer extends 'server'
          ? ZodInputOrType<ResolveResponseType<T['responses'][K]>>
          : ZodInferOrType<ResolveResponseType<T['responses'][K]>>;
      } & (TClientOrServer extends 'client'
        ? {
            headers: Headers;
          }
        : {});
    }[keyof T['responses'] & TStatus]
  | (Or<
      Extends<TStrictStatusCodes, 'force'>,
      And<
        Extends<T, AppRouteStrictStatusCodes>,
        Not<Extends<TStrictStatusCodes, 'ignore'>>
      >
    > extends true
      ? never
      : Exclude<TStatus, keyof T['responses']> extends never
      ? never
      : {
          status: Exclude<TStatus, keyof T['responses']>;
          body: unknown;
        } & (TClientOrServer extends 'client'
          ? {
              headers: Headers;
            }
          : {}));

export type ServerInferResponses<
  T extends AppRoute | AppRouter,
  TStatus extends HTTPStatusCode = HTTPStatusCode,
  TStrictStatusCodes extends 'default' | 'ignore' | 'force' = 'default'
> = T extends AppRoute
  ? Prettify<AppRouteResponses<T, TStatus, 'server', TStrictStatusCodes>>
  : T extends AppRouter
  ? {
      [TKey in keyof T]: ServerInferResponses<
        T[TKey],
        TStatus,
        TStrictStatusCodes
      >;
    }
  : never;

export type ClientInferResponses<
  T extends AppRoute | AppRouter,
  TStatus extends HTTPStatusCode = HTTPStatusCode,
  TStrictStatusCodes extends 'default' | 'ignore' | 'force' = 'default'
> = T extends AppRoute
  ? Prettify<AppRouteResponses<T, TStatus, 'client', TStrictStatusCodes>>
  : T extends AppRouter
  ? {
      [TKey in keyof T]: ClientInferResponses<
        T[TKey],
        TStatus,
        TStrictStatusCodes
      >;
    }
  : never;

export type ServerInferResponseBody<
  T extends AppRoute,
  TStatus extends keyof T['responses'] = keyof T['responses']
> = Prettify<AppRouteResponses<T, TStatus & HTTPStatusCode, 'server'>['body']>;

export type ClientInferResponseBody<
  T extends AppRoute,
  TStatus extends keyof T['responses'] = keyof T['responses']
> = Prettify<AppRouteResponses<T, TStatus & HTTPStatusCode, 'client'>['body']>;

type BodyWithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

export type ServerInferRequest<
  T extends AppRoute | AppRouter,
  TServerHeaders = never
> = T extends AppRoute
  ? Prettify<
      Without<
        {
          params: [keyof PathParamsWithCustomValidators<T>] extends [never]
            ? never
            : Prettify<PathParamsWithCustomValidators<T>>;
          body: T extends AppRouteMutation
            ? BodyWithoutFileIfMultiPart<T>
            : never;
          query: 'query' extends keyof T ? ZodInferOrType<T['query']> : never;
          headers: 'headers' extends keyof T
            ? Prettify<
                LowercaseKeys<ZodInferOrType<T['headers']>> &
                  ([TServerHeaders] extends [never]
                    ? {}
                    : Omit<
                        TServerHeaders,
                        keyof LowercaseKeys<ZodInferOrType<T['headers']>>
                      >)
              >
            : TServerHeaders;
        },
        never
      >
    >
  : T extends AppRouter
  ? { [TKey in keyof T]: ServerInferRequest<T[TKey], TServerHeaders> }
  : never;

type ClientInferRequestBase<
  Framework extends Frameworks,
  T extends AppRoute,
  TClientArgs extends Omit<ClientArgs, 'baseUrl'> = {
    baseHeaders: {};
  },
  THeaders = 'headers' extends keyof T
    ? Prettify<
        PartialByLooseKeys<
          LowercaseKeys<ZodInputOrType<T['headers']>>,
          keyof LowercaseKeys<TClientArgs['baseHeaders']>
        >
      >
    : never,
> = Prettify<
  Without<
    {
      params: [keyof PathParamsWithCustomValidators<T, 'client'>] extends [
        never
      ]
        ? never
        : Prettify<PathParamsWithCustomValidators<T, 'client'>>;
      body: T extends AppRouteMutation
        ? T['body'] extends null
          ? never
          : T['contentType'] extends 'multipart/form-data'
          ? FormData | ZodInputOrType<T['body']>
          : ZodInputOrType<T['body']>
        : never;
      query: 'query' extends keyof T
        ? T['query'] extends null
          ? never
          : ZodInputOrType<T['query']>
        : never;
      headers: THeaders;
      extraHeaders?: {
        [K in NonNullable<keyof THeaders>]?: never;
      } & Record<string, string | undefined>;
      cache?: RequestCache;
      next?: Framework extends 'nextjs'
        ? NextClientArgs['next'] 
        : never;
    } & ExtractExtraParametersFromClientArgs<TClientArgs>,
    never
  >
>;

export type ClientInferRequest<
  T extends AppRoute | AppRouter,
  TClientArgs extends Omit<ClientArgs, 'baseUrl'> = {
    baseHeaders: {};
  },
  Framework extends Frameworks = 'none'
> = T extends AppRoute
  ? ClientInferRequestBase<Framework, T, TClientArgs>
  : T extends AppRouter
  ? { [TKey in keyof T]: ClientInferRequest<T[TKey]> }
  : never;

export type PartialClientInferRequest<
  TRoute extends AppRoute,
  TClientArgs extends Omit<ClientArgs, 'baseUrl'> = {
    baseHeaders: {};
  },
  Framework extends Frameworks = 'none'
> = OptionalIfAllOptional<ClientInferRequest<TRoute, TClientArgs, Framework>>;
