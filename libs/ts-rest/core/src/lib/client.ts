import { z, ZodTypeAny } from 'zod';
import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import { insertParamsIntoPath, ParamsFromUrl } from './paths';
import { convertQueryParamsToUrlString } from './query';
import { HTTPStatusCode } from './status-codes';
import {
  AreAllPropertiesOptional,
  Merge,
  OptionalIfAllOptional,
  Without,
  ZodInferOrType,
} from './type-utils';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? AppRouteFunction<T[TKey]>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.input<T> : T;

/**
 * Extract the path params from the path in the contract
 */
export type PathParamsFromUrl<T extends AppRoute> = ParamsFromUrl<
  T['path']
> extends infer U
  ? U
  : never;

/**
 * Merge PathParamsFromUrl<T> with pathParams schema if it exists
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

interface DataReturnArgsBase<TRoute extends AppRoute> {
  body: TRoute extends AppRouteMutation
    ? AppRouteBodyOrFormData<TRoute>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: 'query' extends keyof TRoute
    ? AppRouteMutationType<TRoute['query']>
    : never;
}

type DataReturnArgs<TRoute extends AppRoute> = OptionalIfAllOptional<
  DataReturnArgsBase<TRoute>
>;

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

export type ApiResponseForRoute<T extends AppRoute> = ApiRouteResponse<T['responses']>


/**
 * Returned from a mutation or query call
 */
export type AppRouteFunction<TRoute extends AppRoute> =
  AreAllPropertiesOptional<Without<DataReturnArgs<TRoute>, never>> extends true
    ? (
        args?: Without<DataReturnArgs<TRoute>, never>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>
    : (
        args: Without<DataReturnArgs<TRoute>, never>
      ) => Promise<ApiRouteResponse<TRoute['responses']>>;

export interface ClientArgs {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
  credentials?: RequestCredentials;
  jsonQuery?: boolean;
}

type ApiFetcher = (args: {
  path: string;
  method: string;
  headers: Record<string, string>;
  body: FormData | string | null | undefined;
  credentials?: RequestCredentials;
}) => Promise<{ status: number; body: unknown }>;

export const defaultApi: ApiFetcher = async ({
  path,
  method,
  headers,
  body,
  credentials,
}) => {
  const result = await fetch(path, { method, headers, body, credentials });

  try {
    return {
      status: result.status,
      body: await result.json(),
    };
  } catch {
    return {
      status: result.status,
      body: await result.text(),
    };
  }
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
  body: unknown
) => {
  const apiFetcher = clientArgs.api || defaultApi;

  if (route.method !== 'GET' && route.contentType === 'multipart/form-data') {
    return apiFetcher({
      path,
      method: route.method,
      credentials: clientArgs.credentials,
      headers: {
        ...clientArgs.baseHeaders,
      },
      body: body instanceof FormData ? body : createFormData(body),
    });
  }

  return apiFetcher({
    path,
    method: route.method,
    credentials: clientArgs.credentials,
    headers: {
      ...clientArgs.baseHeaders,
      'Content-Type': 'application/json',
    },
    body:
      body !== null && body !== undefined ? JSON.stringify(body) : undefined,
  });
};

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
  return async (inputArgs?: DataReturnArgs<any>) => {
    const completeUrl = getCompleteUrl(
      inputArgs?.query,
      clientArgs.baseUrl,
      inputArgs?.params,
      route,
      !!clientArgs.jsonQuery
    );

    return await fetchApi(completeUrl, clientArgs, route, inputArgs?.body);
  };
};

const createNewProxy = (router: AppRouter, args: ClientArgs) => {
  return new Proxy(
    {},
    {
      get: (target, propKey): any => {
        if (typeof propKey === 'string' && propKey in router) {
          const subRouter = router[propKey];

          if (isAppRoute(subRouter)) {
            // If the current router.X is a route, return a function to handle the users args
            return getRouteQuery(subRouter, args);
          } else {
            return createNewProxy(subRouter, args);
          }
        }

        return createNewProxy(router, args);
      },
    }
  );
};

export type InitClientReturn<T extends AppRouter> = RecursiveProxyObj<T>;

export const initClient = <T extends AppRouter>(
  router: T,
  args: ClientArgs
): InitClientReturn<T> => {
  const proxy = createNewProxy(router, args);

  return proxy as InitClientReturn<T>;
};

// takes a router and returns response types for each AppRoute
// does not support nested routers, yet

export function getRouteResponses<T extends AppRouter>(router: T) {
  return {} as {
     [K in keyof typeof router]: 
        typeof router[K] extends AppRoute ? ApiResponseForRoute<typeof router[K]> : 'not a route'
   }
}