import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import { insertParamsIntoPath, ParamsFromUrl } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { HTTPStatusCode } from './status-codes';
import {
  AreAllPropertiesOptional,
  Merge,
  OptionalIfAllOptional,
  Prettify,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from './type-utils';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? AppRouteFunction<T[TKey], TClientArgs>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

type AppRouteMutationType<T> = ZodInputOrType<T>;

/**
 * Extract the path params from the path in the contract
 */
export type PathParamsFromUrl<T extends AppRoute> = ParamsFromUrl<
  T['path']
> extends infer U
  ? U
  : never;

/**
 * Merge `PathParamsFromUrl<T>` with pathParams schema if it exists
 */
export type PathParamsWithCustomValidators<T extends AppRoute> =
  T['pathParams'] extends undefined
    ? PathParamsFromUrl<T>
    : Merge<PathParamsFromUrl<T>, ZodInferOrType<T['pathParams']>>;

// Allow FormData if the contentType is multipart/form-data
type AppRouteBodyOrFormData<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? FormData | AppRouteMutationType<T['body']>
    : AppRouteMutationType<T['body']>;

/**
 * Extract any extra parameters from the client args
 */
type ExtractExtraParametersFromClientArgs<TClientArgs extends ClientArgs> =
  TClientArgs['api'] extends ApiFetcher
    ? Omit<Parameters<TClientArgs['api']>[0], keyof Parameters<ApiFetcher>[0]>
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {};

type DataReturnArgsBase<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteBodyOrFormData<TRoute>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: 'query' extends keyof TRoute
    ? AppRouteMutationType<TRoute['query']>
    : never;
  headers?: Record<string, string>;
} & ExtractExtraParametersFromClientArgs<TClientArgs>;

type DataReturnArgs<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = OptionalIfAllOptional<DataReturnArgsBase<TRoute, TClientArgs>>;

export type ApiRouteResponse<T> =
  | {
      [K in keyof T]: {
        status: K;
        body: ZodInferOrType<T[K]>;
      };
    }[keyof T]
  | {
      status: Exclude<HTTPStatusCode, keyof T>;
      body: unknown;
    };

/**
 * Returned from a mutation or query call
 */
export type AppRouteFunction<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = AreAllPropertiesOptional<
  Without<DataReturnArgs<TRoute, TClientArgs>, never>
> extends true
  ? (
      args?: Prettify<Without<DataReturnArgs<TRoute, TClientArgs>, never>>
    ) => Promise<Prettify<ApiRouteResponse<TRoute['responses']>>>
  : (
      args: Prettify<Without<DataReturnArgs<TRoute, TClientArgs>, never>>
    ) => Promise<Prettify<ApiRouteResponse<TRoute['responses']>>>;

export interface ClientArgs {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
  credentials?: RequestCredentials;
  jsonQuery?: boolean;
}

export type ApiFetcherArgs = {
  path: string;
  method: string;
  headers: Record<string, string>;
  body: FormData | string | null | undefined;
  credentials?: RequestCredentials;
};

type ApiFetcher = (
  args: ApiFetcherArgs
) => Promise<{ status: number; body: unknown }>;

export const defaultApi: ApiFetcher = async ({
  path,
  method,
  headers,
  body,
  credentials,
}) => {
  const result = await fetch(path, { method, headers, body, credentials });
  const contentType = result.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return { status: result.status, body: await result.json() };
  }

  if (contentType?.includes('text/plain')) {
    return { status: result.status, body: await result.text() };
  }

  return { status: result.status, body: await result.blob() };
};

const createFormData = (body: unknown) => {
  const formData = new FormData();

  Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, JSON.stringify(value));
    }
  });

  return formData;
};

export const fetchApi = (
  path: string,
  clientArgs: ClientArgs,
  route: AppRoute,
  body: unknown,
  extraInputArgs: Record<string, unknown>,
  headers: Record<string, string>
) => {
  const apiFetcher = clientArgs.api || defaultApi;

  if (route.method !== 'GET' && route.contentType === 'multipart/form-data') {
    return apiFetcher({
      path,
      method: route.method,
      credentials: clientArgs.credentials,
      headers: {
        // Base headers
        ...clientArgs.baseHeaders,
        // Headers from the api call
        ...headers,
      },
      body: body instanceof FormData ? body : createFormData(body),
      ...extraInputArgs,
    });
  }

  return apiFetcher({
    path,
    method: route.method,
    credentials: clientArgs.credentials,
    headers: {
      ...clientArgs.baseHeaders,
      'Content-Type': 'application/json',
      ...headers,
    },
    body:
      body !== null && body !== undefined ? JSON.stringify(body) : undefined,
    ...extraInputArgs,
  });
};

/**
 * @hidden
 */
export const getCompleteUrl = (
  query: unknown,
  baseUrl: string,
  params: unknown,
  route: AppRoute,
  jsonQuery: boolean
) => {
  const path = insertParamsIntoPath({
    path: route.path,
    params: params as any,
  });
  const queryComponent = convertQueryParamsToUrlString(query, jsonQuery);
  return `${baseUrl}${path}${queryComponent}`;
};

export const getRouteQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return async (inputArgs?: DataReturnArgs<any, ClientArgs>) => {
    const { query, params, body, headers, ...extraInputArgs } = inputArgs || {};

    const completeUrl = getCompleteUrl(
      query,
      clientArgs.baseUrl,
      params,
      route,
      !!clientArgs.jsonQuery
    );

    return await fetchApi(
      completeUrl,
      clientArgs,
      route,
      body,
      extraInputArgs,
      headers || {}
    );
  };
};

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs
> = RecursiveProxyObj<T, TClientArgs>;

export const initClient = <T extends AppRouter, TClientArgs extends ClientArgs>(
  router: T,
  args: TClientArgs
): InitClientReturn<T, TClientArgs> => {
  return Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) => {
      if (isAppRoute(subRouter)) {
        return [key, getRouteQuery(subRouter, args)];
      } else {
        return [key, initClient(subRouter, args)];
      }
    })
  );
};
