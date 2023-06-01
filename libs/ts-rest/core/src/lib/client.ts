import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import { insertParamsIntoPath, ParamsFromUrl } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { HTTPStatusCode } from './status-codes';
import {
  AreAllPropertiesOptional,
  LowercaseKeys,
  Merge,
  OptionalIfAllOptional,
  PartialByLooseKeys,
  Prettify,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from './type-utils';
import { UnknownStatusError } from './unknown-status-error';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? AppRouteFunction<T[TKey], TClientArgs>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

type RecursiveProxyObjNoUnknownStatus<
  T extends AppRouter,
  TClientArgs extends ClientArgs & { throwOnUnknownStatus: true }
> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? AppRouteFunctionNoUnknownStatus<T[TKey], TClientArgs>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObjNoUnknownStatus<T[TKey], TClientArgs>
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
export type PathParamsWithCustomValidators<
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
    ? AppRouteBodyOrFormData<TRoute>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: 'query' extends keyof TRoute
    ? AppRouteMutationType<TRoute['query']>
    : never;
  headers: THeaders;
  extraHeaders?: {
    [K in NonNullable<keyof THeaders>]?: never;
  } & Record<string, string | undefined>;
} & ExtractExtraParametersFromClientArgs<TClientArgs>;

type DataReturnArgs<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = OptionalIfAllOptional<
  Without<DataReturnArgsBase<TRoute, TClientArgs>, never>
>;

export type ApiRouteResponseNoUnknownStatus<T extends AppRoute> =
  | {
      [K in keyof T['responses']]: {
        status: K;
        body: ZodInferOrType<T['responses'][K]>;
      };
    }[keyof T['responses']];

export type ApiRouteResponse<T extends AppRoute> = T extends {
  strictStatusCodes: true;
}
  ? ApiRouteResponseNoUnknownStatus<T>
  :
      | ApiRouteResponseNoUnknownStatus<T>
      | {
          status: Exclude<HTTPStatusCode, keyof T['responses']>;
          body: unknown;
        };

/**
 * @deprecated Only safe to use on the client-side. Use `ServerInferResponses`/`ClientInferResponses` instead.
 */
export type ApiResponseForRoute<T extends AppRoute> = ApiRouteResponse<T>;

/**
 * @deprecated Only safe to use on the client-side. Use `ServerInferResponses`/`ClientInferResponses` instead.
 */
export function getRouteResponses<T extends AppRouter>(router: T) {
  return {} as {
    [K in keyof typeof router]: typeof router[K] extends AppRoute
      ? ApiResponseForRoute<typeof router[K]>
      : 'not a route';
  };
}

/**
 * Returned from a mutation or query call
 */
export type AppRouteFunction<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = AreAllPropertiesOptional<DataReturnArgs<TRoute, TClientArgs>> extends true
  ? (
      args?: Prettify<DataReturnArgs<TRoute, TClientArgs>>
    ) => Promise<Prettify<ApiRouteResponse<TRoute>>>
  : (
      args: Prettify<DataReturnArgs<TRoute, TClientArgs>>
    ) => Promise<Prettify<ApiRouteResponse<TRoute>>>;

/**
 * Returned from a mutation or query call when NoUnknownStatus mode is enabled
 */
export type AppRouteFunctionNoUnknownStatus<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = AreAllPropertiesOptional<DataReturnArgs<TRoute, TClientArgs>> extends true
  ? (
      args?: Prettify<DataReturnArgs<TRoute, TClientArgs>>
    ) => Promise<Prettify<ApiRouteResponseNoUnknownStatus<TRoute>>>
  : (
      args: Prettify<DataReturnArgs<TRoute, TClientArgs>>
    ) => Promise<Prettify<ApiRouteResponseNoUnknownStatus<TRoute>>>;

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
  rawBody: unknown;
  rawQuery: unknown;
  contentType: AppRouteMutation['contentType'];
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
  query,
  extraInputArgs,
  headers,
}: {
  path: string;
  clientArgs: ClientArgs;
  route: AppRoute;
  query: unknown;
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
      rawBody: body,
      rawQuery: query,
      contentType: 'multipart/form-data',
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
    rawBody: body,
    rawQuery: query,
    contentType: route.method !== 'GET' ? 'application/json' : undefined,
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
  clientArgs: InitClientArgs
) => {
  const knownResponseStatuses = Object.keys(route.responses);
  return async (inputArgs?: DataReturnArgsBase<any, ClientArgs>) => {
    const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
      inputArgs || {};

    const completeUrl = getCompleteUrl(
      query,
      clientArgs.baseUrl,
      params,
      route,
      !!clientArgs.jsonQuery
    );

    const response = await fetchApi({
      path: completeUrl,
      clientArgs,
      route,
      body,
      query,
      extraInputArgs,
      headers: {
        ...extraHeaders,
        ...headers,
      },
    });

    if (!clientArgs.throwOnUnknownStatus) {
      return response;
    }

    if (knownResponseStatuses.includes(response.status.toString())) {
      return response;
    }
    throw new UnknownStatusError(response, knownResponseStatuses);
  };
};

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs
> = RecursiveProxyObj<T, TClientArgs>;

export type InitClientReturnNoUnknownStatus<
  T extends AppRouter,
  TClientArgs extends ClientArgs & { throwOnUnknownStatus: true }
> = RecursiveProxyObjNoUnknownStatus<T, TClientArgs>;

export type InitClientArgs = ClientArgs & {
  /**
   * Ensures that the responses from the server match those defined in the
   * contract.
   */
  throwOnUnknownStatus?: boolean;
};

export const initClient = <
  T extends AppRouter,
  TClientArgs extends InitClientArgs
>(
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
