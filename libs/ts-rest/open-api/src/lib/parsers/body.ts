import { AppRoute } from '@ts-rest/core';
import {
  AsyncAndSyncHelper,
  GetAsyncFunction,
  GetSyncFunction,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from '../types';
import { SchemaObject } from 'openapi3-ts';

type GetBodySchemaHelper = AsyncAndSyncHelper<
  {
    appRoute: AppRoute;
    id: string;
    concatenatedPath: string;
  },
  {
    transformSchema: SchemaTransformerSync;
  },
  {
    transformSchema: SchemaTransformerAsync;
  },
  SchemaObject | null
>;

const syncFunc: GetSyncFunction<GetBodySchemaHelper> = ({
  transformSchema,
  appRoute,
  id,
  concatenatedPath,
}) => {
  const schema = 'body' in appRoute ? appRoute.body : undefined;

  const transformedSchema = transformSchema({
    schema,
    appRoute,
    id,
    concatenatedPath,
    type: 'body',
  });

  if (!transformedSchema) {
    return null;
  }

  return transformedSchema;
};

const asyncFunc: GetAsyncFunction<GetBodySchemaHelper> = async ({
  transformSchema,
  appRoute,
  id,
  concatenatedPath,
}) => {
  const schema = 'body' in appRoute ? appRoute.body : undefined;

  const transformedSchema = await transformSchema({
    schema,
    appRoute,
    id,
    concatenatedPath,
    type: 'body',
  });

  return transformedSchema;
};

export const getBodySchema: GetBodySchemaHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
