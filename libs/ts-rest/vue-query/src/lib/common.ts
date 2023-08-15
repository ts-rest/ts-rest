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
  ClientInferResponses,
  ErrorHttpStatusCode,
  PartialClientInferRequest,
  SuccessfulHttpStatusCode,
  fetchApi,
  getCompleteUrl,
} from '@ts-rest/core';

// Data response if it's a 2XX
export type DataResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  SuccessfulHttpStatusCode,
  'force'
>;

// Error response if it's not a 2XX
export type ErrorResponse<TAppRoute extends AppRoute> = ClientInferResponses<
  TAppRoute,
  ErrorHttpStatusCode,
  'ignore'
>;

export const queryFn = <
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs
>(
  route: TAppRoute,
  clientArgs: TClientArgs,
  argsMapper?:
    | ClientInferRequest<AppRouteMutation, ClientArgs>
    | ((
        context: QueryFunctionContext<QueryKey>
      ) => ClientInferRequest<AppRouteMutation, ClientArgs>)
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
      !!clientArgs.jsonQuery
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
