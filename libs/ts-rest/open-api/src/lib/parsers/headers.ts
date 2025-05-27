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

type GetHeaderParameterHelper = AsyncAndSyncHelper<
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
  Array<ParameterObject>
>;

const syncFunc: GetSyncFunction<GetHeaderParameterHelper> = ({
  transformSchema,
  appRoute,
  id,
  concatenatedPath,
}) => {
  const schema = appRoute.headers;

  const transformedSchema = transformSchema({
    schema,
    appRoute,
    id,
    concatenatedPath,
    type: 'header',
  });

  if (!transformedSchema) {
    return [];
  }

  return schemaObjectToParameters(transformedSchema, 'header');
};

const asyncFunc: GetAsyncFunction<GetHeaderParameterHelper> = async ({
  transformSchema,
  appRoute,
  id,
  concatenatedPath,
}) => {
  const schema = appRoute.headers;

  const transformedSchema = await transformSchema({
    schema,
    appRoute,
    id,
    concatenatedPath,
    type: 'header',
  });

  if (!transformedSchema) {
    return [];
  }

  return schemaObjectToParameters(transformedSchema, 'header');
};

export const getHeaderParameterSchema: GetHeaderParameterHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
