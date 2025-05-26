import { AppRoute, isStandardSchema, isZodObject } from '@ts-rest/core';
import {
  AsyncAndSyncHelper,
  GetAsyncFunction,
  GetSyncFunction,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from '../types';
import { ParameterObject } from 'openapi3-ts';
import { schemaObjectToParameters } from './utils';

type GetQueryParameterHelper = AsyncAndSyncHelper<
  {
    appRoute: AppRoute;
    id: string;
    jsonQuery?: boolean;
  },
  {
    transformSchema: SchemaTransformerSync;
  },
  {
    transformSchema: SchemaTransformerAsync;
  },
  Array<ParameterObject>
>;

const syncFunc: GetSyncFunction<GetQueryParameterHelper> = ({
  transformSchema,
  appRoute,
  id,
  jsonQuery = false,
}) => {
  const schema = appRoute.query;
  const isSchema = isZodObject(schema) || isStandardSchema(schema);

  if (!isSchema) {
    return [];
  }

  const transformedSchema = transformSchema(schema, appRoute, id, 'query');

  if (!transformedSchema) {
    return [];
  }

  return schemaObjectToParameters(transformedSchema, 'query', jsonQuery);
};

const asyncFunc: GetAsyncFunction<GetQueryParameterHelper> = async ({
  transformSchema,
  appRoute,
  id,
  jsonQuery = false,
}) => {
  const schema = appRoute.query;
  const isSchema = isZodObject(schema) || isStandardSchema(schema);

  if (!isSchema) {
    return [];
  }

  const transformedSchema = await transformSchema(
    schema,
    appRoute,
    id,
    'query',
  );

  if (!transformedSchema) {
    return [];
  }

  return schemaObjectToParameters(transformedSchema, 'query', jsonQuery);
};

export const getQueryParameterSchema: GetQueryParameterHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
