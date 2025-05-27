import { SchemaTransformerAsync, SchemaTransformerSync } from '../types';
import { AppRoute, isStandardSchema, isZodType } from '@ts-rest/core';
import { generateSchema } from '@anatine/zod-openapi';
import { toJsonSchema } from '@valibot/to-json-schema';
import { convert } from '@openapi-contrib/json-schema-to-openapi-schema';

export const ZOD_SYNC: SchemaTransformerSync = ({ schema }) => {
  if (!isZodType(schema)) {
    return null;
  }

  return generateSchema(schema as any);
};

export const ZOD_ASYNC: SchemaTransformerAsync = async ({ schema }) => {
  if (!isZodType(schema)) {
    return null;
  }

  return generateSchema(schema);
};

export const VALIBOT_ASYNC: SchemaTransformerAsync = async ({ schema }) => {
  if (isStandardSchema(schema) && schema['~standard'].vendor === 'valibot') {
    const jsonSchema = toJsonSchema(schema as any, { errorMode: 'ignore' });
    return await convert(jsonSchema);
  }

  return null;
};
