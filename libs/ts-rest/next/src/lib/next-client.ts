import {
  AppRoute,
  AppRouter,
  AreAllPropertiesOptional,
  ClientArgs,
  ClientInferResponses,
  getRouteQuery,
  isAppRoute,
  PartialClientInferRequest,
  Prettify,
} from '@ts-rest/core';

/**
 * Returned from a mutation or query call
 */
type AppRouteFunction<
  TRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TArgs = PartialClientInferRequest<TRoute, TClientArgs>,
> = AreAllPropertiesOptional<TArgs> extends true
  ? (args?: Prettify<TArgs>) => Promise<Prettify<ClientInferResponses<TRoute>>>
  : (args: Prettify<TArgs>) => Promise<Prettify<ClientInferResponses<TRoute>>>;

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? AppRouteFunction<T[TKey], TClientArgs>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = RecursiveProxyObj<T, TClientArgs>;

export type InitClientArgs = ClientArgs & {
  /**
   * Ensures that the responses from the server match those defined in the
   * contract.
   */
  throwOnUnknownStatus?: boolean;
};

export const initNextClient = <
  T extends AppRouter,
  TClientArgs extends InitClientArgs,
>(
  router: T,
  args: TClientArgs,
): InitClientReturn<T, TClientArgs> => {
  return Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) => {
      if (isAppRoute(subRouter)) {
        return [key, getRouteQuery(subRouter, args)];
      } else {
        return [key, initNextClient(subRouter, args)];
      }
    }),
  );
};
