import { AppRoute, isStandardSchema, isZodObject } from '@ts-rest/core';
import {
  AsyncAndSyncHelper,
  GetAsyncFunction,
  GetSyncFunction,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from '../types';
import { ParameterObject } from 'openapi3-ts';
import { schemaObjectToParameters, schemaToParameter } from './utils';

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

  if (schema === null) {
    return [];
  }

  if (schema === undefined) {
    return [];
  }

  if (typeof schema === 'symbol') {
    return [];
  }

  if (isZodObject(schema)) {
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
  }

  const parameters: ParameterObject[] = [];

  for (const [key, subSchema] of Object.entries(schema)) {
    if (isStandardSchema(subSchema)) {
      const transformedSchema = transformSchema({
        schema: subSchema,
        appRoute,
        id,
        concatenatedPath,
        type: 'header',
      });

      if (!transformedSchema) {
        return [];
      }

      parameters.push(...schemaObjectToParameters(transformedSchema, 'header'));
    }
  }

  return parameters;
};

const asyncFunc: GetAsyncFunction<GetHeaderParameterHelper> = async ({
  transformSchema,
  appRoute,
  id,
  concatenatedPath,
}) => {
  const schema = appRoute.headers;

  if (schema === null) {
    return [];
  }

  if (schema === undefined) {
    return [];
  }

  if (typeof schema === 'symbol') {
    return [];
  }

  if (isZodObject(schema)) {
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
  }

  const parameters: ParameterObject[] = [];

  for (const [key, subSchema] of Object.entries(schema)) {
    if (isStandardSchema(subSchema)) {
      const transformedSchema = await transformSchema({
        schema: subSchema,
        appRoute,
        id,
        concatenatedPath,
        type: 'header',
      });

      if (!transformedSchema) {
        continue;
      }

      const validateEmptyResult = subSchema['~standard'].validate(undefined);

      if (validateEmptyResult instanceof Promise) {
        throw new Error('Schema validation must be synchronous');
      }

      const isRequired = Boolean(validateEmptyResult.issues?.length);

      const asParameter = schemaToParameter(
        transformedSchema,
        'header',
        isRequired,
        key,
        false,
      );
      parameters.push(asParameter);
    }
  }

  return parameters;
};

export const getHeaderParameterSchema: GetHeaderParameterHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
