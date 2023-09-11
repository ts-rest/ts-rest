import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import { insertParamsIntoPath } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { AreAllPropertiesOptional, Prettify } from './type-utils';
import { UnknownStatusError } from './unknown-status-error';
import {
  ClientInferRequest,
  ClientInferResponses,
  PartialClientInferRequest,
  NextClientArgs,
  Frameworks,
} from './infer-types';

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
  TArgs = PartialClientInferRequest<TRoute, TClientArgs>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (args?: Prettify<TArgs>) => Promise<Prettify<ClientInferResponses<TRoute>>>
  : (args: Prettify<TArgs>) => Promise<Prettify<ClientInferResponses<TRoute>>>;

export interface ClientArgs {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
  credentials?: RequestCredentials;
  jsonQuery?: boolean;
}

export type ApiFetcherArgs = {
  route: AppRoute;
  path: string;
  method: string;
  headers: Record<string, string>;
  body: FormData | string | null | undefined;
  rawBody: unknown;
  rawQuery: unknown;
  contentType: AppRouteMutation['contentType'];
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  cache?: RequestCache;
  /**
   * Only to be used by `@ts-rest/next`.
   * You can obtain a Nextjs Client by calling `initNextClient`
   */
  next?: NextClientArgs['next'] | undefined;
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
  path,
  method,
  headers,
  body,
  credentials,
  signal,
  cache,
  next,
  route,
}) => {
  const result = await fetch(path, {
    method,
    headers,
    body,
    credentials,
    signal,
    cache,
    next,
    // we must type cast here because the typescript types for RequestInit
    // do not include properties like "next" for Frameworks (like Nextjs)
  } as RequestInit);
  const contentType = result.headers.get('content-type');

  if (contentType?.includes('application/') && contentType?.includes('json')) {
    if (!route.validateResponseOnClient) {
      return {
        status: result.status,
        body: await result.json(),
        headers: result.headers,
      };
    }

    const jsonData = await result.json();
    const statusCode = result.status;
    const response = route.responses[statusCode];

    return {
      status: statusCode,
      body:
        response && typeof response !== 'symbol' && 'parse' in response
          ? response?.parse(jsonData)
          : jsonData,
      headers: result.headers,
    };
  }

  if (contentType?.includes('text/plain')) {
    return {
      status: result.status,
      body: await result.text(),
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
  signal,
  next,
}: {
  path: string;
  clientArgs: ClientArgs;
  route: AppRoute;
  query: unknown;
  body: unknown;
  extraInputArgs: Record<string, unknown>;
  headers: Record<string, string | undefined>;
  signal?: AbortSignal;
  // ---- Framework specific ----
  /**
   * only to be used by @ts-rest/next
   * You can obtain a Nextjs Client by calling `initNextClient`
   */
  next?: NextClientArgs['next'] | undefined;
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
      route,
      path,
      method: route.method,
      credentials: clientArgs.credentials,
      headers: combinedHeaders,
      body: body instanceof FormData ? body : createFormData(body),
      rawBody: body,
      rawQuery: query,
      contentType: 'multipart/form-data',
      signal,
      next,
      ...extraInputArgs,
    });
  }

  return apiFetcher({
    route,
    path,
    method: route.method,
    credentials: clientArgs.credentials,
    headers: {
      ...(body !== null && body !== undefined && { 'content-type': 'application/json' }),
      ...combinedHeaders,
    },
    body:
      body !== null && body !== undefined ? JSON.stringify(body) : undefined,
    rawBody: body,
    rawQuery: query,
    contentType: route.method !== 'GET' ? 'application/json' : undefined,
    signal,
    next,
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

export const getRouteQuery = <
  TAppRoute extends AppRoute,
  Framework extends Frameworks = 'none'
>(
  route: TAppRoute,
  clientArgs: InitClientArgs
) => {
  const knownResponseStatuses = Object.keys(route.responses);
  return async (
    inputArgs?: Framework extends 'nextjs'
      ? ClientInferRequest<AppRouteMutation, ClientArgs, 'nextjs'>
      : ClientInferRequest<AppRouteMutation, ClientArgs>
  ) => {
    const {
      query,
      params,
      body,
      headers,
      extraHeaders,
      next,
      ...extraInputArgs
    } =
      // ---- Merge all framework Request infer types ----
      (inputArgs as ClientInferRequest<AppRouteMutation, ClientArgs, 'nextjs'> &
        ClientInferRequest<AppRouteMutation, ClientArgs>) || {};

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
      next,
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
        return [key, getRouteQuery<typeof subRouter>(subRouter, args)];
      } else {
        return [key, initClient(subRouter, args)];
      }
    })
  );
};
