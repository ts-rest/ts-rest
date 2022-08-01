import { z } from 'zod';
import {
  ApiFetcher,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  DataReturn,
  defaultApi,
  getRouteQuery,
  isAppRoute,
  Without,
} from '@ts-rest/core';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey]>, never>
    : never;
};

type AppRouteMutationType<T> = T extends z.AnyZodObject ? z.infer<T> : T;

type UseQueryArgs<TAppRoute extends AppRoute> = {
  useQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute>
    : never;
  query: TAppRoute extends AppRouteQuery ? DataReturn<TAppRoute> : never;
  useMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute>
    : never;
  mutation: TAppRoute extends AppRouteMutation ? DataReturn<TAppRoute> : never;
};

type DataReturnArgs<TRoute extends AppRoute> = {
  body: TRoute extends AppRouteMutation
    ? AppRouteMutationType<TRoute['body']> extends null
      ? never
      : AppRouteMutationType<TRoute['body']>
    : never;
  params: Parameters<TRoute['path']>[0] extends null
    ? never
    : Parameters<TRoute['path']>[0];
  query: TRoute['query'] extends z.AnyZodObject
    ? AppRouteMutationType<TRoute['query']> extends null
      ? never
      : AppRouteMutationType<TRoute['query']>
    : never;
};

// Used on X.useQuery
type DataReturnQuery<TAppRoute extends AppRoute> = (
  queryKey: QueryKey,
  args: Without<DataReturnArgs<TAppRoute>, never>,
  options?: UseQueryOptions<TAppRoute['response']>
) => UseQueryResult<TAppRoute['response']>;

// Used pn X.useMutation
type DataReturnMutation<TAppRoute extends AppRoute> = (
  options?: UseMutationOptions<
    TAppRoute['response'],
    unknown,
    Without<DataReturnArgs<TAppRoute>, never>,
    unknown
  >
) => UseMutationResult<
  TAppRoute['response'],
  unknown,
  Without<DataReturnArgs<TAppRoute>, never>,
  unknown
>;

const getCompleteUrl = (query: any, baseUrl: string, path: string) => {
  const queryString =
    typeof query === 'object'
      ? Object.keys(query)
          .map((key) => {
            return (
              encodeURIComponent(key) + '=' + encodeURIComponent(query[key])
            );
          })
          .join('&')
      : '';

  const completeUrl = `${baseUrl}${path}${
    queryString.length > 0 && queryString !== null && queryString !== undefined
      ? '?' + queryString
      : ''
  }`;

  return completeUrl;
};

const getRouteUseQuery = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (
    queryKey: QueryKey,
    args: DataReturnArgs<TAppRoute>,
    options?: UseQueryOptions<TAppRoute['response']>
  ) => {
    const dataFn = async () => {
      const path = route.path(args.params);

      const completeUrl = getCompleteUrl(args.query, clientArgs.baseUrl, path);

      const result = await clientArgs.api({
        path: completeUrl,
        method: route.method,
        headers: {
          ...clientArgs.baseHeaders,
        },
        body: undefined,
      });

      return result.data;
    };

    return useQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <TAppRoute extends AppRoute>(
  route: TAppRoute,
  clientArgs: ClientArgs
) => {
  return (options?: UseMutationOptions<TAppRoute['response']>) => {
    const mutationFunction = async (args: DataReturnArgs<TAppRoute>) => {
      const path = route.path(args.params);

      const completeUrl = getCompleteUrl(args.query, clientArgs.baseUrl, path);

      const result = await clientArgs.api({
        path: completeUrl,
        method: route.method,
        headers: {
          ...clientArgs.baseHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.body),
      });

      return result.data;
    };

    return useMutation(
      mutationFunction as () => Promise<TAppRoute['response']>,
      options
    );
  };
};

const createNewProxy = (router: AppRouter | AppRoute, args: ClientArgs) => {
  return new Proxy(
    {},
    {
      get: (_, propKey): any => {
        if (isAppRoute(router)) {
          switch (propKey) {
            case 'query':
              throw getRouteQuery(router, args);
            case 'mutation':
              throw getRouteQuery(router, args);
            case 'useQuery':
              return getRouteUseQuery(router, args);
            case 'useMutation':
              return getRouteUseMutation(router, args);
            default:
              throw new Error(`Unknown method called on ${String(propKey)}`);
          }
        } else {
          const subRouter = router[propKey as string];

          return createNewProxy(subRouter, args);
        }
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

  return proxy as InitClientReturn<T>;
};
