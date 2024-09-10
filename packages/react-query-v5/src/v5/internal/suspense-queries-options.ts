import { UseSuspenseQueryResult } from '@tanstack/react-query';
import { AppRoute, ClientArgs } from '@ts-rest/core';
import { UseSuspenseQueryOptions } from '../types/hooks-options';
import { DataResponse, ErrorResponse } from '../types/common';

type GetUseSuspenseQueryOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  T,
> = T extends {
  select?: (data: any) => infer TData;
}
  ? UseSuspenseQueryOptions<TAppRoute, TClientArgs, TData>
  : UseSuspenseQueryOptions<TAppRoute, TClientArgs>;

type GetUseSuspenseQueryResult<TAppRoute extends AppRoute, T> = T extends {
  select?: (data: any) => infer TData;
}
  ? UseSuspenseQueryResult<
      TAppRoute,
      unknown extends TData ? DataResponse<TAppRoute> : TData
    >
  : UseSuspenseQueryResult<TAppRoute>;

type MAXIMUM_DEPTH = 20;

export type SuspenseQueriesOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryOptions<TAppRoute, TClientArgs>>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResults, GetUseSuspenseQueryOptions<TAppRoute, TClientArgs, Head>]
  : T extends [infer Head, ...infer Tails]
  ? SuspenseQueriesOptions<
      TAppRoute,
      TClientArgs,
      [...Tails],
      [...TResults, GetUseSuspenseQueryOptions<TAppRoute, TClientArgs, Head>],
      [...TDepth, 1]
    >
  : Array<unknown> extends T
  ? T
  : T extends Array<
      UseSuspenseQueryOptions<TAppRoute, TClientArgs, infer TData>
    >
  ? Array<UseSuspenseQueryOptions<TAppRoute, TClientArgs, TData>>
  : Array<UseSuspenseQueryOptions<TAppRoute, TClientArgs>>;

export type SuspenseQueriesResults<
  TAppRoute extends AppRoute,
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryResult>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResults, GetUseSuspenseQueryResult<TAppRoute, Head>]
  : T extends [infer Head, ...infer Tails]
  ? SuspenseQueriesResults<
      TAppRoute,
      [...Tails],
      [...TResults, GetUseSuspenseQueryResult<TAppRoute, Head>],
      [...TDepth, 1]
    >
  : T extends Array<UseSuspenseQueryOptions<TAppRoute, ClientArgs, infer TData>>
  ? Array<
      UseSuspenseQueryResult<
        unknown extends TData ? DataResponse<TAppRoute> : TData,
        ErrorResponse<TAppRoute>
      >
    >
  : Array<UseSuspenseQueryResult>;
