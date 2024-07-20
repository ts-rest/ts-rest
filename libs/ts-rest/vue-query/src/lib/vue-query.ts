import {
  AppRoute,
  AppRouteFunction,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ClientArgs,
  getRouteQuery,
  isAppRoute,
  Without,
} from '@ts-rest/core';
import { DataReturnQuery, getRouteUseQuery } from './use-query';
import {
  DataReturnInfiniteQuery,
  getRouteUseInfiniteQuery,
} from './use-infinite-query';
import { DataReturnMutation, getRouteUseMutation } from './use-mutation';

type UseQueryArgs<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
> = {
  useQuery: TAppRoute extends AppRouteQuery
    ? DataReturnQuery<TAppRoute, TClientArgs>
    : never;
  useInfiniteQuery: TAppRoute extends AppRouteQuery
    ? DataReturnInfiniteQuery<TAppRoute, TClientArgs>
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

type RecursiveProxyObj<T extends AppRouter, TClientArgs extends ClientArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? Without<UseQueryArgs<T[TKey], TClientArgs>, never>
    : T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey], TClientArgs>
    : never;
};

export type InitClientReturn<
  T extends AppRouter,
  TClientArgs extends ClientArgs,
> = RecursiveProxyObj<T, TClientArgs>;

export const initQueryClient = <
  T extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  router: T,
  args: TClientArgs,
): InitClientReturn<T, TClientArgs> =>
  Object.fromEntries(
    Object.entries(router).map(([key, subRouter]) =>
      isAppRoute(subRouter)
        ? [
            key,
            {
              query: getRouteQuery(subRouter, args),
              mutation: getRouteQuery(subRouter, args),
              useQuery: getRouteUseQuery(subRouter, args),
              useInfiniteQuery: getRouteUseInfiniteQuery(subRouter, args),
              useMutation: getRouteUseMutation(subRouter, args),
            },
          ]
        : [key, initQueryClient(subRouter, args)],
    ),
  );
