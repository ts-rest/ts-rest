import { AppRoute } from '@ts-rest/core';
import { SchemaObject } from 'openapi3-ts';

export type SchemaTransformerSync = (
  schema: unknown,
  appRoute: AppRoute,
  id: string,
  type: 'body' | 'response' | 'query' | 'header' | 'path',
  useOutput?: boolean,
) => SchemaObject | null;

export type SchemaTransformerAsync = (
  schema: unknown,
  appRoute: AppRoute,
  id: string,
  type: 'body' | 'response' | 'query' | 'header' | 'path',
  useOutput?: boolean,
) => Promise<SchemaObject | null>;

export type SchemaTransformer = SchemaTransformerSync | SchemaTransformerAsync;

/**
 * We need to have many functions that are the same, but some are sync and some are async.
 *
 * This helper lets us make this trivial and avoids having different types for each function.
 */
export type AsyncAndSyncHelper<T, TFuncSyncArgs, TFuncAsyncArgs, TReturn> = {
  sync: (args: T & TFuncSyncArgs) => TReturn;
  async: (args: T & TFuncAsyncArgs) => Promise<TReturn>;
};

export type GetSyncFunction<THelper> = THelper extends AsyncAndSyncHelper<
  any,
  any,
  any,
  any
>
  ? THelper['sync']
  : never;

export type GetAsyncFunction<THelper> = THelper extends AsyncAndSyncHelper<
  any,
  any,
  any,
  any
>
  ? THelper['async']
  : never;
