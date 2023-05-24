import {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions as TanStackUseInfiniteQueryOptions,
  useInfiniteQuery,
  UseMutationOptions as TanStackUseMutationOptions,
  useMutation,
  UseQueryOptions as TanStackUseQueryOptions,
  useQueries,
  useQuery,
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  AreAllPropertiesOptional,
  ClientArgs,
  fetchApi,
  getCompleteUrl,
  getRouteQuery,
  isAppRoute,
  Prettify,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import {
  DataReturnArgs,
  DataReturnArgsBase,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from './types';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

type UseQueryArgs<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = {
  useQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute, TClientArgs>
    : never;
  useInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute, TClientArgs>
    : never;
  useQueries: TAppRoute extends AppRouteQuery
    ? DataReturnQueries<TAppRoute, TClientArgs>
    : never;
  query: TAppRoute extends AppRouteQuery
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
  useMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute, TClientArgs>
    : never;
  mutation: TAppRoute extends AppRouteMutation
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
};

// Used on X.useQuery
type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: UseQueryOptions<TAppRoute>
    ) => UseQueryResult<TAppRoute>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: UseQueryOptions<TAppRoute>
    ) => UseQueryResult<TAppRoute>;

type DataReturnQueriesOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = Without<DataReturnArgs<TAppRoute, TClientArgs>, never> &
  Omit<UseQueryOptions<TAppRoute>, 'queryFn'> & {
    queryKey: QueryKey;
  };

type DataReturnQueries<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueries = readonly DataReturnQueriesOptions<TAppRoute, TClientArgs>[]
> = (args: {
  queries: TQueries;
  context?: UseQueryOptions<TAppRoute>['context'];
}) => UseQueryResult<TAppRoute>[];

// Used on X.useInfiniteQuery
type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = AreAllPropertiesOptional<
  Without<DataReturnArgs<TAppRoute, TClientArgs>, never>
> extends true
  ? (
      queryKey: QueryKey,
      args?: (
        context: QueryFunctionContext<QueryKey>
      ) => Without<DataReturnArgs<TAppRoute, TClientArgs>, never>,
      options?: UseInfiniteQueryOptions<TAppRoute>
    ) => UseInfiniteQueryResult<TAppRoute>
  : (
      queryKey: QueryKey,
      args: (
        context: QueryFunctionContext<QueryKey>
      ) => Without<DataReturnArgs<TAppRoute, TClientArgs>, never>,
      options?: UseInfiniteQueryOptions<TAppRoute>
    ) => UseInfiniteQueryResult<TAppRoute>;

// Used pn X.useMutation
type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  options?: UseMutationOptions<TAppRoute, TClientArgs>
) => UseMutationResult<TAppRoute, TClientArgs>;

const getRouteUseQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (
    queryKey: QueryKey,
    args?: DataReturnArgsBase<TAppRoute, TClientArgs>,
    options?: TanStackUseQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async () => {
      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        args || {};

      const path = getCompleteUrl(
        query,
        clientArgs.baseUrl,
        params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        path,
        clientArgs,
        route,
        body,
        headers: {
          ...extraHeaders,
          ...headers,
        },
        extraInputArgs,
      });

      // If the response is not a 2XX, throw an error to be handled by react-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return useQuery(queryKey, dataFn, options);
  };
};

const getRouteUseQueries = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (args: Parameters<DataReturnQueries<TAppRoute, TClientArgs>>[0]) => {
    const queries = args.queries.map((queryArgs: any) => {
      const queryFn: QueryFunction<TAppRoute['responses']> = async () => {
        const {
          query,
          params,
          body,
          headers,
          extraHeaders,
          credentials,
          queryKey,
          retry,
          ...extraInputArgs
        } = queryArgs || {};

        const path = getCompleteUrl(
          'query' in queryArgs ? queryArgs?.query : undefined,
          clientArgs.baseUrl,
          'params' in queryArgs ? queryArgs?.params : undefined,
          route,
          !!clientArgs.jsonQuery
        );

        const result = await fetchApi({
          path,
          clientArgs,
          route,
          body: 'body' in queryArgs ? queryArgs?.body : undefined,
          headers: {
            ...extraHeaders,
            ...headers,
          },
          extraInputArgs,
        });

        // If the response is not a 2XX, throw an error to be handled by react-query
        if (!String(result.status).startsWith('2')) {
          throw result;
        }

        return result;
      };

      return {
        queryFn,
        ...queryArgs,
      };
    });

    return useQueries({ queries, context: args.context });
  };
};

const getRouteUseInfiniteQuery = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (
    queryKey: QueryKey,
    args: (
      context: QueryFunctionContext
    ) => DataReturnArgsBase<TAppRoute, TClientArgs>,
    options?: TanStackUseInfiniteQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (
      infiniteQueryParams
    ) => {
      const resultingQueryArgs = args(infiniteQueryParams);

      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        resultingQueryArgs || {};

      const path = getCompleteUrl(
        query,
        clientArgs.baseUrl,
        params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        path,
        clientArgs,
        route,
        body,
        headers: {
          ...extraHeaders,
          ...headers,
        },
        extraInputArgs,
      });

      // If the response is not a 2XX, throw an error to be handled by react-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return useInfiniteQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (options?: TanStackUseMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args?: DataReturnArgsBase<TAppRoute, TClientArgs>
    ) => {
      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        args || {};

      const path = getCompleteUrl(
        args?.query,
        clientArgs.baseUrl,
        args?.params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        path,
        clientArgs,
        route,
        body: args?.body,
        extraInputArgs,
        headers: {
          ...extraHeaders,
          ...headers,
        },
      });

      // If the response is not a 2XX, throw an error to be handled by react-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return useMutation(
      mutationFunction as () => Promise<ZodInferOrType<TAppRoute['responses']>>,
      options
    );
  };
};

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs
> = RecursiveProxyObj<T, TClientArgs>;

export const initQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs
>(
  router: T,
  args: TClientArgs
): InitClientReturn<T, TClientArgs> => {
  return Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) => {
      if (isAppRoute(subRouter)) {
        return [
          key,
          {
            query: getRouteQuery(subRouter, args),
            mutation: getRouteQuery(subRouter, args),
            useQuery: getRouteUseQuery(subRouter, args),
            useQueries: getRouteUseQueries(subRouter, args),
            useInfiniteQuery: getRouteUseInfiniteQuery(subRouter, args),
            useMutation: getRouteUseMutation(subRouter, args),
          },
        ];
      } else {
        return [key, initQueryClient(subRouter, args)];
      }
    })
  );
};
