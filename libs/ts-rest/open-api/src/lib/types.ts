import { AppRoute, StandardSchemaV1 } from '@ts-rest/core';
import { ParameterObject, ResponseObject, SchemaObject } from 'openapi3-ts';

type SchemaTransformerArgs = {
  /**
   * The schema to transform.
   */
  schema: unknown;
  /**
   * The app route.
   */
  appRoute: AppRoute;
  /**
   * The key of the route in a contract e.g. `getPokemon` or `createPokemon`.
   */
  id: string;
  /**
   * The concatenated path of the route. e.g. `pokemon.getPokemon` or `pokemon.createPokemon`.
   */
  concatenatedPath: string;
  /**
   * Where the schema is used, can be used to conditionally transform the schema.
   */
  type: 'body' | 'response' | 'query' | 'header' | 'path';
};

/**
 * Sync schema transformer.
 *
 * This will be invoked for all schemas, e.g. every query, pathParam, body, etc.
 *
 * You should guard against your schema type here, and return null if it's not the schema you want to transform.
 */
export type SchemaTransformerSync = (
  args: SchemaTransformerArgs,
) => SchemaObject | null;

/**
 * Async schema transformer.
 *
 * This will be invoked for all schemas, e.g. every query, pathParam, body, etc.
 *
 * You should guard against your schema type here, and return null if it's not the schema you want to transform.
 */
export type SchemaTransformerAsync = (
  args: SchemaTransformerArgs,
) => Promise<SchemaObject | null>;

export type SchemaTransformer = SchemaTransformerSync | SchemaTransformerAsync;

/**
 * We need to have many functions that are the same, but some are sync and some are async.
 *
 * This helper lets us make this trivial and avoids having different types for each function.
 *
 * @hidden
 */
export type AsyncAndSyncHelper<T, TFuncSyncArgs, TFuncAsyncArgs, TReturn> = {
  sync: (args: T & TFuncSyncArgs) => TReturn;
  async: (args: T & TFuncAsyncArgs) => Promise<TReturn>;
};

/**
 * @hidden
 */
export type GetSyncFunction<THelper> = THelper extends AsyncAndSyncHelper<
  any,
  any,
  any,
  any
>
  ? THelper['sync']
  : never;

/**
 * @hidden
 */
export type GetAsyncFunction<THelper> = THelper extends AsyncAndSyncHelper<
  any,
  any,
  any,
  any
>
  ? THelper['async']
  : never;

/**
 * @hidden
 */
export type RouterPath = {
  id: string;
  path: string;
  route: AppRoute;
  paths: string[];
};

/**
 * @hidden
 */
export type PathSchemaResults = {
  path: ParameterObject[];
  headers: ParameterObject[];
  query: ParameterObject[];
  body: SchemaObject | null;
  /**
   * Status code to response.
   */
  responses: Record<string, SchemaObject>;
};
