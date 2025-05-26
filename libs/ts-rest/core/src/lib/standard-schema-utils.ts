import { ZodError, ZodIssue, ZodObject, ZodSchema, z } from 'zod';
import { StandardSchemaV1 } from './standard-schema';
import { StandardSchemaError } from './validation-error';
import { isZodType, zodMerge } from './zod-utils';

const VENDOR_LEGACY_ZOD = 'zod-ts-rest-polyfill';
const VENDOR_STANDARD_SCHEMA = 'ts-rest-combined';

/**
 * Type guard to check if the schema is a standard schema.
 *
 * @param schema - unknown
 * @returns boolean
 */
export const isStandardSchema = (
  schema: unknown,
): schema is StandardSchemaV1 => {
  if (!schema) {
    return false;
  }

  const standard = (schema as StandardSchemaV1)?.['~standard'];

  if (!standard) {
    return false;
  }

  return standard.version === 1 && typeof standard.validate === 'function';
};

/**
 * Takes in an unknown object and returns either a standard schema or null, if it encounters
 * a legacy zod (<3.24.0) schema it'll return a polyfill for it.
 *
 * @param schema - unknown
 * @returns StandardSchemaV1<unknown, unknown> | null
 */
export const parseAsStandardSchema = (
  schema: unknown,
): StandardSchemaV1<unknown, unknown> | null => {
  const isStandard = isStandardSchema(schema);

  if (isStandard) {
    return schema;
  }

  /**
   * Legacy support for zod pre 3.24.0
   *
   * @deprecated - remove in next major version when zod (standard schema) is required
   */
  if (isZodType(schema)) {
    const standardSchema: StandardSchemaV1<unknown, unknown>['~standard'] = {
      vendor: VENDOR_LEGACY_ZOD,
      version: 1,
      validate: (input) => {
        const result = schema.safeParse(input);

        if (result.success) {
          return {
            value: result.data,
          };
        }

        return {
          issues: result.error.issues,
        };
      },
    };

    // Assign to avoid mutating the original schema
    Object.assign(schema, {
      '~standard': standardSchema,
    });

    return schema as unknown as StandardSchemaV1<unknown, unknown>;
  }

  return null;
};

/**
 * Combines two standard schemas into a single standard schema.
 *
 * The combined schema will run the validation of both schemas and return the result of the first schema that
 * succeeds.
 *
 * If either schema fails, the combined schema will return the issues from both schemas.
 *
 * @param a - StandardSchemaV1<unknown, unknown>
 * @param b - StandardSchemaV1<unknown, unknown>
 * @returns StandardSchemaV1<unknown, unknown>
 */
export const combineStandardSchemas = (
  a: StandardSchemaV1<unknown, unknown>,
  b: StandardSchemaV1<unknown, unknown>,
): StandardSchemaV1<unknown, unknown> => {
  const isAZodLegacy = a['~standard'].vendor === VENDOR_LEGACY_ZOD;
  const isBZodLegacy = b['~standard'].vendor === VENDOR_LEGACY_ZOD;

  const isJustOneZodLegacy = isAZodLegacy !== isBZodLegacy;

  if (isJustOneZodLegacy) {
    throw new Error(
      'Cannot combine a zod < 3.24.0 schema with a standard schema, please use zod >= 3.24.0 or any other standard schema library',
    );
  }

  /**
   * To maintain existing behavior, we do a zod level merge of the two schemas.
   */
  if (isAZodLegacy && isBZodLegacy) {
    const merged = zodMerge(a, b);

    /**
     * Cleanup any residual ~standard key that may have been left over from before the merge,
     * allowing parseAsStandardSchema to re-pollyfill the schema.
     */
    if ('~standard' in merged) {
      delete merged['~standard'];
    }

    const schema = parseAsStandardSchema(merged);

    if (!schema) {
      throw new Error('Failed to merge zod legacy schemas');
    }

    return schema;
  }

  const standardSchema: StandardSchemaV1<unknown, unknown>['~standard'] = {
    vendor: VENDOR_STANDARD_SCHEMA,
    version: 1,
    validate: (input) => {
      const result = a['~standard'].validate(input);
      const result2 = b['~standard'].validate(input);

      if (result instanceof Promise || result2 instanceof Promise) {
        throw new Error('Schema validation must be synchronous');
      }

      // TODO: Agree on the behavior of this for standard schemas
      if (result.issues || result2.issues) {
        return {
          issues: [...(result.issues || []), ...(result2.issues || [])],
        };
      }

      return {
        value: {
          ...(result.value || {}),
          ...(result2.value || {}),
        },
      };
    },
  };

  return {
    '~standard': standardSchema,
  };
};

/**
 * Similar to validateAgainstStandardSchema, but it takes an unknown schema, it will not validate if no schema provided and will check the schema is
 * valid before validating the data.
 *
 * This is super handy for validating request bodies, headers, etc. as it passes through the data if no schema is provided.
 */
export const validateIfSchema = (
  data: unknown,
  schema: unknown,
  {
    passThroughExtraKeys = false,
  }: {
    passThroughExtraKeys?: boolean;
  } = {},
): { value?: unknown; error?: StandardSchemaError | ZodError } => {
  const schemaStandard = parseAsStandardSchema(schema);

  if (!schemaStandard) {
    return { value: data };
  }

  return validateAgainstStandardSchema(data, schemaStandard, {
    passThroughExtraKeys,
  });
};

export const validateAgainstStandardSchema = (
  data: unknown,
  schema: StandardSchemaV1<unknown, unknown>,
  {
    passThroughExtraKeys = false,
  }: {
    passThroughExtraKeys?: boolean;
  } = {},
): { value?: unknown; error?: StandardSchemaError | ZodError } => {
  const result = schema['~standard'].validate(data);

  if (result instanceof Promise) {
    throw new Error('Schema validation must be synchronous');
  }

  if (result.issues) {
    /**
     * If the schema is a zod polyfill, we need to return a ZodError.
     *
     * @deprecated - remove in next major version when zod (standard schema) is required
     */
    if (schema['~standard'].vendor === VENDOR_LEGACY_ZOD) {
      return {
        error: new ZodError(result.issues as ZodIssue[]),
      };
    }

    return {
      error: new StandardSchemaError(result.issues),
    };
  }

  if (passThroughExtraKeys && typeof data === 'object' && result.value) {
    return {
      value: { ...data, ...result.value },
    };
  }

  return {
    value: result.value,
  };
};

/**
 * Use this to decide whether to return the old-style ZodError or the new-style StandardSchemaError
 */
export const areAllSchemasLegacyZod = (
  schemas: (StandardSchemaV1<unknown, unknown> | null | undefined)[],
): boolean => {
  return schemas
    .filter(Boolean)
    .every((schema) => schema?.['~standard'].vendor === VENDOR_LEGACY_ZOD);
};
