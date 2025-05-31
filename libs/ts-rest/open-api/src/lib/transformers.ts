import type { ZodTypeAny } from 'zod';
import { SchemaTransformer } from './types';
import { generateSchema } from '@anatine/zod-openapi';

const isZodType = (obj: unknown): obj is ZodTypeAny => {
  return typeof (obj as ZodTypeAny)?.safeParse === 'function';
};

/**
 * Default schema transformer that uses @anatine/zod-openapi
 * Maintains backward compatibility with existing behavior
 *
 * This should be removed from the library in the future, we could expose copy-pastable code instead
 */
export const ZOD_3_SCHEMA_TRANSFORMER: SchemaTransformer = ({
  schema,
  type,
  concatenatedPath,
}) => {
  if (!isZodType(schema)) {
    return null;
  }

  const useOutput = type === 'response';

  return generateSchema(schema, useOutput);
};
