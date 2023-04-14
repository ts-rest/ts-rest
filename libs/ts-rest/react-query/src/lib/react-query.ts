import {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueries,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  AreAllPropertiesOptional,
  ClientArgs,
  ExtractExtraParametersFromClientArgs,
  fetchApi,
  getCompleteUrl,
  getRouteQuery,
  HTTPStatusCode,
  isAppRoute,
  LowercaseKeys,
  OptionalIfAllOptional,
  PartialByLooseKeys,
  PathParamsFromUrl,
  Prettify,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from '@ts-rest/core';
import { z } from 'zod';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

type AppRouteMutationType<T> = T extends z.ZodTypeAny ? z.input<T> : T;

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
    ? AppRouteMutationType<TRoute['body']> extends null
      ? never
      : AppRouteMutationType<TRoute['body']>
    : never;
  params: PathParamsFromUrl<TRoute>;
  query: 'query' extends keyof TRoute
    ? AppRouteMutationType<TRoute['query']> extends null
      ? never
      : AppRouteMutationType<TRoute['query']>
    : never;
  headers: THeaders;
  extraHeaders?: {
    [K in keyof NonNullable<keyof THeaders>]: never;
  } & Record<string, string | undefined>;
} & ExtractExtraParametersFromClientArgs<TClientArgs>;

type DataReturnArgs<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = OptionalIfAllOptional<DataReturnArgsBase<TRoute, TClientArgs>>;

/**
 * Split up the data and error to support react-query style
 * useQuery and useMutation error handling
 */
type SuccessResponseMapper<T> = {
  [K in keyof T]: K extends SuccessfulHttpStatusCode
    ? { status: K; body: ZodInferOrType<T[K]> }
    : never;
}[keyof T];

/**
 * Returns any handled errors, or any unhandled non success errors
 */
type ErrorResponseMapper<T> =
  | {
      [K in keyof T]: K extends SuccessfulHttpStatusCode
        ? never
        : { status: K; body: ZodInferOrType<T[K]> };
    }[keyof T]
  // If the response isn't one of our typed ones. Return "unknown"
  | {
      status: Exclude<HTTPStatusCode, keyof T | SuccessfulHttpStatusCode>;
      body: unknown;
    };

// Data response if it's a 2XX
type DataResponse<T extends AppRoute> = SuccessResponseMapper<T['responses']>;

// Error response if it's not a 2XX
type ErrorResponse<T extends AppRoute> = ErrorResponseMapper<T['responses']>;

// Used on X.useQuery
type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>
> = AreAllPropertiesOptional<TArgs> extends true
  ? (
      queryKey: QueryKey,
      args?: TArgs,
      options?: UseQueryOptions<
        DataResponse<TAppRoute>,
        ErrorResponse<TAppRoute>
      >
    ) => UseQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>
  : (
      queryKey: QueryKey,
      args: TArgs,
      options?: UseQueryOptions<
        DataResponse<TAppRoute>,
        ErrorResponse<TAppRoute>
      >
    ) => UseQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

type DataReturnQueriesOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = Without<DataReturnArgs<TAppRoute, TClientArgs>, never> &
  Omit<UseQueryOptions<TAppRoute['responses']>, 'queryFn'> & {
    queryKey: QueryKey;
  };

type DataReturnQueries<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueries = readonly DataReturnQueriesOptions<TAppRoute, TClientArgs>[]
> = (args: {
  queries: TQueries;
  context?: UseQueryOptions['context'];
}) => UseQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>[];

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
      options?: UseInfiniteQueryOptions<
        DataResponse<TAppRoute>,
        ErrorResponse<TAppRoute>
      >
    ) => UseInfiniteQueryResult<
      DataResponse<TAppRoute>,
      ErrorResponse<TAppRoute>
    >
  : (
      queryKey: QueryKey,
      args: (
        context: QueryFunctionContext<QueryKey>
      ) => Without<DataReturnArgs<TAppRoute, TClientArgs>, never>,
      options?: UseInfiniteQueryOptions<
        DataResponse<TAppRoute>,
        ErrorResponse<TAppRoute>
      >
    ) => UseInfiniteQueryResult<
      DataResponse<TAppRoute>,
      ErrorResponse<TAppRoute>
    >;

// Used pn X.useMutation
type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  options?: UseMutationOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>,
    unknown
  >
) => UseMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>,
  unknown
>;

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
    options?: UseQueryOptions<TAppRoute['responses']>
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
    options?: UseInfiniteQueryOptions<TAppRoute['responses']>
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
  return (options?: UseMutationOptions<TAppRoute['responses']>) => {
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
