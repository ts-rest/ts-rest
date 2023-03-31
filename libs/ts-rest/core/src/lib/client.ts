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
export type ExtractExtraParametersFromClientArgs<
  TClientArgs extends ClientArgs
> = TClientArgs['api'] extends ApiFetcher
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
  /**
   * Additional headers to send with the request, merged over baseHeaders,
   *
   * Unset a header by setting it to undefined
   */
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

export type ResponseForRoute<T extends AppRoute> = ApiRouteResponse<
  T['responses']
>

export type ResponsesForRouter<T extends AppRouter> = {
  [K in keyof T]: T[K] extends AppRoute
  ? ResponseForRoute<T[K]>
  : T[K] extends AppRouter ? ResponsesForRouter<T[K]> : never;
};

/**
 * 
 * @deprecated
 */
export function getRouteResponses<T extends AppRouter>(router: T) {
  return {} as {
    [K in keyof typeof router]: typeof router[K] extends AppRoute
      ? ResponseForRoute<typeof router[K]>
      : 'not a route';
  };
}

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

export type ApiFetcher = (
  args: ApiFetcherArgs
) => Promise<{ status: number; body: unknown }>;

/**
 * Default fetch api implementation:
 *
 * Can be used as a reference for implementing your own fetcher,
 * or used in the "api" field of ClientArgs to allow you to hook
 * into the request to run custom logic
 */
export const tsRestFetchApi: ApiFetcher = async ({
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

const normalizeHeaders = (headers: Record<string, string | undefined>) => {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
};

export const fetchApi = ({
  path,
  clientArgs,
  route,
  body,
  extraInputArgs,
  headers,
}: {
  path: string;
  clientArgs: ClientArgs;
  route: AppRoute;
  body: unknown;
  extraInputArgs: Record<string, unknown>;
  headers: Record<string, string | undefined>;
}) => {
  const apiFetcher = clientArgs.api || tsRestFetchApi;

  const combinedHeaders = {
    ...normalizeHeaders(clientArgs.baseHeaders),
    ...normalizeHeaders(headers),
  } as Record<string, string>;

  // Remove any headers that are set to undefined
  Object.keys(combinedHeaders).forEach((key) => {
    if (combinedHeaders[key] === undefined) {
      delete combinedHeaders[key];
    }
  });

  if (route.method !== 'GET' && route.contentType === 'multipart/form-data') {
    return apiFetcher({
      path,
      method: route.method,
      credentials: clientArgs.credentials,
      headers: combinedHeaders,
      body: body instanceof FormData ? body : createFormData(body),
      ...extraInputArgs,
    });
  }

  return apiFetcher({
    path,
    method: route.method,
    credentials: clientArgs.credentials,
    headers: {
      'content-type': 'application/json',
      ...combinedHeaders,
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

    return await fetchApi({
      path: completeUrl,
      clientArgs,
      route,
      body,
      extraInputArgs,
      headers: headers || {},
    });
  };
};

export type ApiResponseForRoute<T extends AppRoute> = ApiRouteResponse<
  T['responses']
>;

// takes a router and returns response types for each AppRoute
// does not support nested routers, yet

export function getRouteResponses<T extends AppRouter>(router: T) {
  return {} as {
    [K in keyof typeof router]: typeof router[K] extends AppRoute
      ? ApiResponseForRoute<typeof router[K]>
      : 'not a route';
  };
}

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
