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
}) => {
  const schema = 'body' in appRoute ? appRoute.body : undefined;

  const transformedSchema = transformSchema({
    schema,
    appRoute,
    id,
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
}) => {
  const schema = 'body' in appRoute ? appRoute.body : undefined;

  const transformedSchema = await transformSchema({
    schema,
    appRoute,
    id,
    type: 'body',
  });

  return transformedSchema;
};

export const getBodySchema: GetBodySchemaHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
