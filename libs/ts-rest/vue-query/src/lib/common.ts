import {
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from '@tanstack/vue-query';
import {
  AppRoute,
  AppRouteMutation,
  ClientArgs,
  ClientInferRequest,
  fetchApi,
  getCompleteUrl,
  DataResponse as CoreDataResponse,
  ErrorResponse as CoreErrorResponse,
} from '@ts-rest/core';

// Data response if it's a 2XX
/** @deprecated use directly the `DataResponse` from @ts-rest/core */
export type DataResponse<TAppRoute extends AppRoute> =
  CoreDataResponse<TAppRoute>;

// Error response if it's not a 2XX
/** @deprecated use directly the `ErrorResponse` from @ts-rest/core */
export type ErrorResponse<TAppRoute extends AppRoute> =
  CoreErrorResponse<TAppRoute>;

export const queryFn = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  argsMapper?:
    | ClientInferRequest<AppRouteMutation, ClientArgs>
    | ((
        context: QueryFunctionContext<QueryKey>,
      ) => ClientInferRequest<AppRouteMutation, ClientArgs>),
): QueryFunction<TAppRoute['responses']> => {
  return async (queryFnContext: QueryFunctionContext) => {
    const args =
      typeof argsMapper === 'function'
        ? argsMapper(queryFnContext)
        : argsMapper;

    const { query, params, body, headers, extraHeaders, ...extraInputArgs } =
      args || {};

    const path = getCompleteUrl(
      query,
      clientArgs.baseUrl,
      params,
      route,
      !!clientArgs.jsonQuery,
    );

    const result = await fetchApi({
      signal: queryFnContext?.signal,
      path,
      clientArgs,
      route,
      body,
      query,
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
};
