import { z, ZodTypeAny } from 'zod';
import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import { Without, ZodInferOrType } from './type-utils';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? DataReturn<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends ZodTypeAny ? z.infer<T> : T;

type DataReturnArgs<TRoute extends AppRoute> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']>
    : never;
  params: Parameters<TRoute['path']>[0] extends undefined
    ? never
    : Parameters<TRoute['path']>[0];
  query: TRoute['query'] extends ZodTypeAny
    ? AppRouteMutationType<TRoute['query']>
    : never;
};

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

export type ClientArgs = {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api?: ApiFetcher;
};

type ApiFetcher = (args: {
  path: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}) => Promise<{ status: number; body: unknown }>;

export const defaultApi: ApiFetcher = async ({
  path,
  method,
  headers,
  body,
}) => {
  const result = await fetch(path, { method, headers, body });

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

export const getRouteQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return async (inputArgs: DataReturnArgs<any>) => {
    const path = route.path(inputArgs.params);

    const queryString =
      typeof inputArgs.query === 'object'
        ? Object.keys(inputArgs.query)
            .map((key) => {
              if (inputArgs.query[key] === undefined) {
                return null;
              }
              return (
                encodeURIComponent(key) +
                '=' +
                encodeURIComponent(inputArgs.query[key])
              );
            })
            .filter(Boolean)
            .join('&')
        : '';

    const completeUrl = `${clientArgs.baseUrl}${path}${
      queryString.length > 0 &&
      queryString !== null &&
      queryString !== undefined
        ? '?' + queryString
        : ''
    }`;

    const apiFetcher = clientArgs.api || defaultApi;

    const result = await apiFetcher({
      path: completeUrl,
      method: route.method,
      headers: {
        ...clientArgs.baseHeaders,
        'Content-Type': 'application/json',
      },
      body:
        inputArgs.body !== null && inputArgs.body !== undefined
          ? JSON.stringify(inputArgs.body)
          : undefined,
    });

    return result;
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

  // TODO: See if we can type proxy correctly
  return proxy as InitClientReturn<T>;
};

export type SuccessfulHttpStatusCode =
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207;

/**
 * All available HTTP Status codes
 */
export type HTTPStatusCode =
  | 100
  | 101
  | 102
  | 200
  | 201
  | 202
  | 203
  | 204
  | 205
  | 206
  | 207
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 307
  | 308
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 419
  | 420
  | 421
  | 422
  | 423
  | 424
  | 428
  | 429
  | 431
  | 451
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 507
  | 511;
