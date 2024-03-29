import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import { insertParamsIntoPath } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { AreAllPropertiesOptional, Prettify } from './type-utils';
import { UnknownStatusError } from './unknown-status-error';
import {
  ClientInferRequest,
  ClientInferResponses,
  PartialClientInferRequest,
} from './infer-types';
import { isZodType } from './zod-utils';
import { Equal, Expect } from './test-helpers';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? AppRouteFunction<T[TKey], TClientArgs>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

/**
 * @deprecated Only safe to use on the client-side. Use `ServerInferResponses`/`ClientInferResponses` instead.
 */
export type ApiResponseForRoute<T extends AppRoute> = ClientInferResponses<T>;

/**
 * @deprecated Only safe to use on the client-side. Use `ServerInferResponses`/`ClientInferResponses` instead.
 */
export function getRouteResponses<T extends AppRouter>(router: T) {
  return {} as ClientInferResponses<T>;
}

/**
 * Returned from a mutation or query call
 */
export type AppRouteFunction<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (args?: Prettify<TArgs>) => Promise<Prettify<ClientInferResponses<TRoute>>>
  : (args: Prettify<TArgs>) => Promise<Prettify<ClientInferResponses<TRoute>>>;

export type FetchOptions = Omit<RequestInit, 'method' | 'headers' | 'body'>;

export interface OverrideableClientArgs {
  baseUrl: string;
  credentials?: RequestCredentials;
  jsonQuery?: boolean;
  validateResponse?: boolean;
}

export interface ClientArgs extends OverrideableClientArgs {
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
}

export type ApiFetcherArgs = {
  route: AppRoute;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: FormData | URLSearchParams | string | null | undefined;
  rawBody: unknown;
  rawQuery: unknown;
  contentType: AppRouteMutation['contentType'];
  fetchOptions?: FetchOptions;
  validateResponse?: boolean;

  /**
   * @deprecated Use `fetchOptions.credentials` instead
   */
  credentials?: RequestCredentials;
  /**
   * @deprecated Use `fetchOptions.signal` instead
   */
  signal?: AbortSignal;
  /**
   * @deprecated Use `fetchOptions.cache` instead
   */
  cache?: RequestCache;
  /**
   * @deprecated Use `fetchOptions.next` instead
   */
  next?: { revalidate?: number | false; tags?: string[] } | undefined;
};

export type ApiFetcher = (args: ApiFetcherArgs) => Promise<{
  status: number;
  body: unknown;
  headers: Headers;
}>;

/**
 * Default fetch api implementation:
 *
 * Can be used as a reference for implementing your own fetcher,
 * or used in the "api" field of ClientArgs to allow you to hook
 * into the request to run custom logic
 */
export const tsRestFetchApi: ApiFetcher = async ({
  route,
  path,
  method,
  headers,
  body,
  validateResponse,
  fetchOptions,
}) => {
  const result = await fetch(path, {
    ...fetchOptions,
    method,
    headers,
    body,
  });

  const contentType = result.headers.get('content-type');
  const contentLength = result.headers.has('content-length')
    ? Number(result.headers.get('content-length'))
    : undefined;

  if (contentType?.includes('application/') && contentType?.includes('json')) {
    const response = {
      status: result.status,
      body:
        contentLength === 0
          ? undefined
          : await result.text().then((text) => {
              if (text?.trim()) return JSON.parse(text);
              return undefined;
            }),
      headers: result.headers,
    };

    const responseSchema = route.responses[response.status];
    if (
      (validateResponse ?? route.validateResponseOnClient) &&
      isZodType(responseSchema)
    ) {
      return {
        ...response,
        body:
          contentLength === 0 ? undefined : responseSchema.parse(response.body),
      };
    }

    return response;
  }

  if (contentType?.includes('text/')) {
    return {
      status: result.status,
      body: contentLength === 0 ? undefined : await result.text(),
      headers: result.headers,
    };
  }

  return {
    status: result.status,
    body: await result.blob(),
    headers: result.headers,
  };
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
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
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
  fetchOptions,
}: {
  path: string;
  clientArgs: ClientArgs;
  route: AppRoute;
  query: unknown;
  body: unknown;
  extraInputArgs: Record<string, unknown>;
  headers: Record<string, string | undefined>;
  fetchOptions?: FetchOptions;
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

  let fetcherArgs: ApiFetcherArgs = {
    route,
    path,
    method: route.method,
    headers: combinedHeaders,
    body: undefined,
    rawBody: body,
    rawQuery: query,
    contentType: undefined,
    fetchOptions: {
      ...(clientArgs.credentials && { credentials: clientArgs.credentials }),
      ...fetchOptions,
    },
    ...(fetchOptions?.signal && { signal: fetchOptions.signal }),
    ...(fetchOptions?.cache && { cache: fetchOptions.cache }),
    ...(fetchOptions &&
      'next' in fetchOptions &&
      !!fetchOptions?.next && { next: fetchOptions.next }),
  };

  if (route.method !== 'GET') {
    if (route.contentType === 'multipart/form-data') {
      fetcherArgs = {
        ...fetcherArgs,
        contentType: 'multipart/form-data',
        body: body instanceof FormData ? body : createFormData(body),
      };
    } else if (route.contentType === 'application/x-www-form-urlencoded') {
      fetcherArgs = {
        ...fetcherArgs,
        contentType: 'application/x-www-form-urlencoded',
        headers: {
          ...fetcherArgs.headers,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body:
          typeof body === 'string'
            ? body
            : new URLSearchParams(
                body as Record<string, string> | URLSearchParams,
              ),
      };
    } else if (body !== null && body !== undefined) {
      fetcherArgs = {
        ...fetcherArgs,
        contentType: 'application/json',
        headers: {
          ...fetcherArgs.headers,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      };
    }
  }

  return apiFetcher({
    ...fetcherArgs,
    ...extraInputArgs,
  });
};

export const evaluateFetchApiArgs = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: InitClientArgs,
  inputArgs?: ClientInferRequest<AppRouteMutation, ClientArgs>,
) => {
  const {
    query,
    params,
    body,
    headers,
    extraHeaders,
    overrideClientOptions,
    fetchOptions,

    // TODO: remove in 4.0
    cache,

    // TODO: remove in 4.0
    next,

    // extra input args
    ...extraInputArgs
  } =
    (inputArgs as ClientInferRequest<AppRouteMutation, ClientArgs> & {
      next?: any;
    }) || {};

  // assert that we removed all non-extra args
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type AssertExtraInputArgsEmpty = Expect<Equal<typeof extraInputArgs, {}>>;

  const overriddenClientArgs = {
    ...clientArgs,
    ...overrideClientOptions,
  };

  const completeUrl = getCompleteUrl(
    query,
    overriddenClientArgs.baseUrl,
    params,
    route,
    !!overriddenClientArgs.jsonQuery,
  );

  return {
    path: completeUrl,
    clientArgs: overriddenClientArgs,
    route,
    body,
    query,
    extraInputArgs,
    fetchOptions: {
      ...(cache && { cache }),
      ...(next && { next }),
      ...fetchOptions,
    },
    headers: {
      ...extraHeaders,
      ...headers,
    },
  } as Parameters<typeof fetchApi>[0];
};

/**
 * @hidden
 */
export const getCompleteUrl = (
  query: unknown,
  baseUrl: string,
  params: unknown,
  route: AppRoute,
  jsonQuery: boolean,
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
  clientArgs: InitClientArgs,
) => {
  const knownResponseStatuses = Object.keys(route.responses);
  return async (
    inputArgs?: ClientInferRequest<AppRouteMutation, ClientArgs>,
  ) => {
    const fetchApiArgs = evaluateFetchApiArgs(route, clientArgs, inputArgs);
    const response = await fetchApi(fetchApiArgs);

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
  TClientArgs extends ClientArgs,
> = RecursiveProxyObj<T, TClientArgs>;

export type InitClientArgs = ClientArgs & {
  /**
   * Ensures that the responses from the server match those defined in the
   * contract.
   */
  throwOnUnknownStatus?: boolean;
};

export const initClient = <
  T extends AppRouter,
  TClientArgs extends InitClientArgs,
>(
  router: T,
  args: TClientArgs,
): InitClientReturn<T, TClientArgs> => {
  return Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) => {
      if (isAppRoute(subRouter)) {
        return [key, getRouteQuery(subRouter, args)];
      } else {
        return [key, initClient(subRouter, args)];
      }
    }),
  );
};
