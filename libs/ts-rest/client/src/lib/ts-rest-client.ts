import { z } from 'zod';
import {
  AppRoute,
  AppRouteMutation,
  AppRouter,
  isAppRoute,
} from '@ts-rest/core';
// import { Without } from "./";

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? DataReturn<T[TKey]>
    : never;
};

type AppRouteMutationType<T> = T extends z.AnyZodObject ? z.infer<T> : T;

type DataReturnArgs<TRoute extends AppRoute> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']>
    : never;
  params: Parameters<TRoute['path']>[0] extends undefined
    ? never
    : Parameters<TRoute['path']>[0];
  query: TRoute['query'] extends z.AnyZodObject
    ? AppRouteMutationType<TRoute['query']>
    : never;
};

type DataReturn<TRoute extends AppRoute> = (
  args: DataReturnArgs<TRoute> // FIXME: Without
) => Promise<{ data: TRoute['response']; status: number }>;

type ClientArgs = {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api: ApiFetcher;
};

const defaultApi: ApiFetcher = async ({ path, method, headers, body }) => {
  const result = await fetch(path, { method, headers, body }).then((res) =>
    res.json()
  );

  return { status: 200, data: result };
};

export type ApiFetcher = (args: {
  path: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}) => Promise<{
  status: number;
  data: unknown;
}>;

const getRouteQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return async (inputArgs: DataReturnArgs<any>) => {
    const path = route.path(inputArgs.params);

    const queryString =
      typeof inputArgs.query === 'object'
        ? Object.keys(inputArgs.query)
            .map((key) => {
              return (
                encodeURIComponent(key) +
                '=' +
                encodeURIComponent(inputArgs.query[key])
              );
            })
            .join('&')
        : '';

    const completeUrl = `${clientArgs.baseUrl}${path}${
      queryString.length > 0 &&
      queryString !== null &&
      queryString !== undefined
        ? '?' + queryString
        : ''
    }`;

    const result = await clientArgs.api({
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

    return { data: result.data, status: result.status };
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

export const initQueryClient = <T extends AppRouter>(
  router: T,
  args: Omit<ClientArgs, 'api'> & { api?: ApiFetcher }
): InitClientReturn<T> => {
  const proxy = createNewProxy(router, {
    ...args,
    api: args.api || defaultApi,
  });

  // TODO: See if we can type proxy correctly
  return proxy as InitClientReturn<T>;
};
