import type {
  OmitKeyof,
  QueriesPlaceholderDataFunction,
} from '@tanstack/query-core';
import { DefinedUseQueryResult, UseQueryResult } from '@tanstack/react-query';
import { AppRoute, ClientArgs } from '@ts-rest/core';
import { UseQueryOptions } from '../types/hooks-options';
import { DataResponse, ErrorResponse } from '../types/common';

type UseQueryOptionsForUseQueries<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TData = DataResponse<TAppRoute>,
> = OmitKeyof<
  UseQueryOptions<TAppRoute, TClientArgs, TData>,
  'placeholderData'
> & {
  placeholderData?:
    | DataResponse<TAppRoute>
    | QueriesPlaceholderDataFunction<DataResponse<TAppRoute>>;
};

type GetUseQueryOptionsForUseQueries<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  T,
> = T extends {
  select?: (data: any) => infer TData;
}
  ? UseQueryOptionsForUseQueries<TAppRoute, TClientArgs, TData>
  : UseQueryOptionsForUseQueries<TAppRoute, TClientArgs>;

type GetUseQueryResult<TAppRoute extends AppRoute, T> = T extends {
  select?: (data: any) => infer TData;
}
  ? GetDefinedOrUndefinedQueryResult<
      T,
      unknown extends TData ? DataResponse<TAppRoute> : TData,
      ErrorResponse<TAppRoute>
    >
  : UseQueryResult<DataResponse<TAppRoute>, ErrorResponse<TAppRoute>>;

type MAXIMUM_DEPTH = 20;

export type QueriesOptions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries<TAppRoute, TClientArgs>>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResults, GetUseQueryOptionsForUseQueries<TAppRoute, TClientArgs, Head>]
  : T extends [infer Head, ...infer Tails]
  ? QueriesOptions<
      TAppRoute,
      TClientArgs,
      [...Tails],
      [
        ...TResults,
        GetUseQueryOptionsForUseQueries<TAppRoute, TClientArgs, Head>,
      ],
      [...TDepth, 1]
    >
  : ReadonlyArray<unknown> extends T
  ? T
  : T extends Array<
      UseQueryOptionsForUseQueries<TAppRoute, TClientArgs, infer TData>
    >
  ? Array<UseQueryOptionsForUseQueries<TAppRoute, TClientArgs, TData>>
  : Array<UseQueryOptionsForUseQueries<TAppRoute, TClientArgs>>;

export type QueriesResults<
  TAppRoute extends AppRoute,
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryResult>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResults, GetUseQueryResult<TAppRoute, Head>]
  : T extends [infer Head, ...infer Tails]
  ? QueriesResults<
      TAppRoute,
      [...Tails],
      [...TResults, GetUseQueryResult<TAppRoute, Head>],
      [...TDepth, 1]
    >
  : T extends Array<
      UseQueryOptionsForUseQueries<TAppRoute, ClientArgs, infer TData>
    >
  ? Array<
      UseQueryResult<
        unknown extends TData ? DataResponse<TAppRoute> : TData,
        ErrorResponse<TAppRoute>
      >
    >
  : Array<UseQueryResult>;

type GetDefinedOrUndefinedQueryResult<T, TData, TError> = T extends {
  initialData?: infer TInitialData;
}
  ? unknown extends TInitialData
    ? UseQueryResult<TData, TError>
    : TInitialData extends TData
    ? DefinedUseQueryResult<TData, TError>
    : TInitialData extends () => infer TInitialDataResult
    ? unknown extends TInitialDataResult
      ? UseQueryResult<TData, TError>
      : TInitialDataResult extends TData
      ? DefinedUseQueryResult<TData, TError>
      : UseQueryResult<TData, TError>
    : UseQueryResult<TData, TError>
  : UseQueryResult<TData, TError>;
