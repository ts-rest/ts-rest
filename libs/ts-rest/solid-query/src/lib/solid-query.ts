import {
  createInfiniteQuery,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  createMutation,
  CreateMutationOptions,
  CreateMutationResult,
  createQuery,
  CreateQueryOptions,
  CreateQueryResult,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/solid-query';
import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  ExtractExtraParametersFromClientArgs,
  fetchApi,
  getCompleteUrl,
  getRouteQuery,
  HTTPStatusCode,
  isAppRoute,
  LowercaseKeys,
  PartialByLooseKeys,
  PathParamsFromUrl,
  Prettify,
  SuccessfulHttpStatusCode,
  Without,
  ZodInferOrType,
  ZodInputOrType,
} from '@ts-rest/core';

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

type AppRouteMutationType<T> = ZodInputOrType<T>;

type UseQueryArgs<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = {
  createQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute, TClientArgs>
    : never;
  createInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute, TClientArgs>
    : never;
  query: TAppRoute extends AppRouteQuery
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
  createMutation: TAppRoute extends AppRouteMutation
    ? DataReturnMutation<TAppRoute, TClientArgs>
    : never;
  mutation: TAppRoute extends AppRouteMutation
    ? AppRouteFunction<TAppRoute, TClientArgs>
    : never;
};

type DataReturnArgs<
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
    [K in NonNullable<keyof THeaders>]?: never;
  } & Record<string, string | undefined>;
} & ExtractExtraParametersFromClientArgs<TClientArgs>;

/**
 * Split up the data and error to support solid-query style
 * createQuery and createMutation error handling
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

// Used on X.createQuery
type DataReturnQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  queryKey: () => QueryKey,
  args: Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>,
  options?: CreateQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >
) => CreateQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

// Used on X.useInfiniteQuery
type DataReturnInfiniteQuery<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  queryKey: () => QueryKey,
  args: (
    context: QueryFunctionContext<QueryKey>
  ) => Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>,
  options?: CreateInfiniteQueryOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>
  >
) => CreateInfiniteQueryResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>
>;

// Used pn X.createMutation
type DataReturnMutation<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
> = (
  options?: CreateMutationOptions<
    DataResponse<TAppRoute>,
    ErrorResponse<TAppRoute>,
    Prettify<Without<DataReturnArgs<TAppRoute, TClientArgs>, never>>,
    unknown
  >
) => CreateMutationResult<
  DataResponse<TAppRoute>,
  ErrorResponse<TAppRoute>,
  Without<DataReturnArgs<TAppRoute, TClientArgs>, never>,
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
    queryKey: () => QueryKey,
    args: DataReturnArgs<TAppRoute, TClientArgs>,
    options?: CreateQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async ({
      signal,
    }) => {
      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        args || {};

      const path = getCompleteUrl(
        args.query,
        clientArgs.baseUrl,
        args.params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        path,
        clientArgs,
        route,
        body: args.body,
        query,
        headers: {
          ...extraHeaders,
          ...headers,
        },
        signal,
        extraInputArgs,
      });

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return createQuery(queryKey, dataFn, options);
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
    queryKey: () => QueryKey,
    args: (
      context: QueryFunctionContext
    ) => DataReturnArgs<TAppRoute, TClientArgs>,
    options?: CreateInfiniteQueryOptions<TAppRoute['responses']>
  ) => {
    const dataFn: QueryFunction<TAppRoute['responses']> = async (
      infiniteQueryParams
    ) => {
      const resultingQueryArgs = args(infiniteQueryParams);

      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        resultingQueryArgs || {};

      const path = getCompleteUrl(
        resultingQueryArgs.query,
        clientArgs.baseUrl,
        resultingQueryArgs.params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        signal: infiniteQueryParams.signal,
        path,
        clientArgs,
        route,
        body: resultingQueryArgs.body,
        query,
        headers: {
          ...extraHeaders,
          ...headers,
        },
        extraInputArgs,
      });

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return createInfiniteQuery(queryKey, dataFn, options);
  };
};

const getRouteUseMutation = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs
) => {
  return (options?: CreateMutationOptions<TAppRoute['responses']>) => {
    const mutationFunction = async (
      args: DataReturnArgs<TAppRoute, TClientArgs>
    ) => {
      const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
        args || {};

      const path = getCompleteUrl(
        args.query,
        clientArgs.baseUrl,
        args.params,
        route,
        !!clientArgs.jsonQuery
      );

      const result = await fetchApi({
        path,
        clientArgs,
        route,
        body: args.body,
        query,
        headers: {
          ...extraHeaders,
          ...headers,
        },
        extraInputArgs,
      });

      // If the response is not a 2XX, throw an error to be handled by solid-query
      if (!String(result.status).startsWith('2')) {
        throw result;
      }

      return result;
    };

    return createMutation(
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
            createQuery: getRouteUseQuery(subRouter, args),
            createInfiniteQuery: getRouteUseInfiniteQuery(subRouter, args),
            createMutation: getRouteUseMutation(subRouter, args),
          },
        ];
      } else {
        return [key, initQueryClient(subRouter, args)];
      }
    })
  );
};
