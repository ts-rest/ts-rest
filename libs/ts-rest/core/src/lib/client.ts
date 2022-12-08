import { z, ZodTypeAny } from 'zod';
import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import {
  convertQueryParamsToUrlString,
  insertParamsIntoPath,
  ParamsFromUrl,
} from './paths';
import { HTTPStatusCode } from './status-codes';
import { Merge, Without, ZodInferOrType } from './type-utils';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? DataReturn<T[TKey]>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.infer<T> : T;

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

interface DataReturnArgs<TRoute extends AppRoute> {
  body: TRoute extends AppRouteMutation
    ? AppRouteBodyOrFormData<TRoute>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: TRoute['query'] extends ZodTypeAny
    ? AppRouteMutationType<TRoute['query']>
    : never;
}

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
export type DataReturn<TRoute extends AppRoute> = (
  args: Without<DataReturnArgs<TRoute>, never>
) => Promise<ApiRouteResponse<TRoute['responses']>>;

export interface ClientArgs {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
  credentials?: RequestCredentials;
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
  query: any,
  baseUrl: string,
  params: any,
  route: AppRoute
) => {
  const path = insertParamsIntoPath({
    path: route.path,
    params: params as any,
  });
  const queryComponent = convertQueryParamsToUrlString(query);
  return `${baseUrl}${path}${queryComponent}`;
};

export const getRouteQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return async (inputArgs: DataReturnArgs<any>) => {
    const completeUrl = getCompleteUrl(
      inputArgs.query,
      clientArgs.baseUrl,
      inputArgs.params,
      route
    );

    return await fetchApi(completeUrl, clientArgs, route, inputArgs.body);
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
