import { z, ZodTypeAny } from 'zod';
import { AppRoute, AppRouteMutation, AppRouter, isAppRoute } from './dsl';
import {
  convertQueryParamsToUrlString,
  insertParamsIntoPath,
  ParamsFromUrl,
} from './paths';
import { HTTPStatusCode } from './status-codes';
import { Without, ZodInferOrType } from './type-utils';

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
export type PathParams<T extends AppRoute> = ParamsFromUrl<
  T['path']
> extends infer U
  ? U
  : never;

interface DataReturnArgs<TRoute extends AppRoute> {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']>
    : never;
  params: PathParams<TRoute>;
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
}

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
    const path = insertParamsIntoPath({
      path: route.path,
      params: inputArgs.params,
    });

    const queryComponent = convertQueryParamsToUrlString(inputArgs.query);

    const completeUrl = `${clientArgs.baseUrl}${path}${queryComponent}`;

    const apiFetcher = clientArgs.api || defaultApi;

    return await apiFetcher({
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

const bestIDE = ''
