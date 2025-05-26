import { SchemaTransformerAsync, SchemaTransformerSync } from '../types';
import { AppRoute, isStandardSchema, isZodType } from '@ts-rest/core';
import { generateSchema } from '@anatine/zod-openapi';
import { toJsonSchema } from '@valibot/to-json-schema';
import { convert } from '@openapi-contrib/json-schema-to-openapi-schema';

export const ZOD_SYNC: SchemaTransformerSync = (
  schema: unknown,
  _appRoute: AppRoute,
  _id: string,
  _type: 'body' | 'response' | 'query' | 'header' | 'path',
  useOutput = false,
) => {
  if (!isZodType(schema)) {
    return null;
  }

  return generateSchema(schema as any, useOutput);
};

export const ZOD_ASYNC: SchemaTransformerAsync = async (
  schema: unknown,
  _appRoute: AppRoute,
  _id: string,
  _type: 'body' | 'response' | 'query' | 'header' | 'path',
  useOutput = false,
) => {
  if (!isZodType(schema)) {
    return null;
  }

  return generateSchema(schema, useOutput);
};

export const VALIBOT_ASYNC: SchemaTransformerAsync = async (
  schema: unknown,
  _appRoute: AppRoute,
  _id: string,
  _type: 'body' | 'response' | 'query' | 'header' | 'path',
  useOutput = false,
) => {
  if (isStandardSchema(schema) && schema['~standard'].vendor === 'valibot') {
    const jsonSchema = toJsonSchema(schema as any, { errorMode: 'ignore' });
    return await convert(jsonSchema);
  }

  return {};
};
