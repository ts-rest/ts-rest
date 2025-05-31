import { ZodError, ZodIssue, ZodObject } from 'zod';
import { StandardSchemaV1 } from './standard-schema';
import { StandardSchemaError } from './validation-error';
import { isZodType, zodMerge } from './zod-utils';
import { ContractAnyType, ContractAnyTypeLegacy } from './dsl';

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
 * Since 3.53.0 we've moved to headers using an object with schemas inside it, rather than a top level schema.
 *
 * This makes it easier to merge schemas together.
 *
 * @param data - Data to validate e.g. headers
 * @param schemaObject - Schema object to validate against e.g. { 'x-foo': v.string() }
 * @returns
 */
export const validateMultiSchemaObject = (
  data: unknown,
  schemaObject:
    | Record<string, ContractAnyType>
    | ContractAnyTypeLegacy
    | undefined,
): {
  value?: unknown;
  error?: StandardSchemaError | ZodError;
  schemasUsed: Array<StandardSchemaV1<unknown, unknown>>;
} => {
  const schema = parseAsStandardSchema(schemaObject);

  // If the top level is not null we know it's a valid schema we can validate against
  if (schema !== null) {
    const result = validateAgainstStandardSchema(data, schema, {
      passThroughExtraKeys: true,
    });

    return {
      value: result.value,
      error: result.error,
      schemasUsed: [schema],
    };
  }

  const headersMap = new Map<string, unknown>(Object.entries(data ?? {}));

  const vendorSet = new Set<string>();
  const subSchemas = new Map<string, StandardSchemaV1<unknown, unknown>>();

  for (const [key, schema] of Object.entries(schemaObject ?? {})) {
    const parsedSchema = parseAsStandardSchema(schema);

    if (schema === null) {
      continue;
    }

    if (typeof schema === 'symbol') {
      continue;
    }

    if (parsedSchema !== null) {
      subSchemas.set(key, parsedSchema);
      vendorSet.add(parsedSchema['~standard'].vendor);
    } else {
      throw new Error(
        `Invalid schema provided for header ${key}, please use a valid schema`,
      );
    }
  }

  if (vendorSet.size > 1 && vendorSet.has(VENDOR_LEGACY_ZOD)) {
    throw new Error(
      'Cannot mix zod legacy and standard schema libraries, please use zod >= 3.24.0 or any other standard schema library',
    );
  }

  if (subSchemas.size === 0) {
    return {
      value: data,
      schemasUsed: [],
    };
  }

  const issues: StandardSchemaV1.Issue[] = [];

  for (const [key, schema] of subSchemas.entries()) {
    const value = headersMap.get(key);
    console.log(`validating against schema key:${key} value:${value}`);
    const result = validateAgainstStandardSchema(value, schema);

    if (result.error) {
      for (const issue of result.error.issues) {
        issues.push({
          ...issue,
          path: [key],
        });
      }
    } else {
      headersMap.set(key, result.value);
    }
  }

  console.log('issues', issues);

  if (issues.length > 0) {
    return {
      error: new StandardSchemaError(issues),
      schemasUsed: [...subSchemas.values()],
    };
  }

  return {
    value: Object.fromEntries(headersMap.entries()),
    schemasUsed: [...subSchemas.values()],
  };
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
 * Merges two header schemas together, these can either be legacy zod objects or objects containing standard schemas.
 */
export const mergeHeaderSchemasForRoute = (
  baseSchema: unknown,
  routeSchema: unknown,
): unknown => {
  if (!baseSchema) {
    return routeSchema;
  }

  if (!routeSchema) {
    return baseSchema;
  }

  if (baseSchema instanceof ZodObject && routeSchema instanceof ZodObject) {
    const merged = zodMerge(baseSchema, routeSchema);

    return merged;
  }

  const mergedObjects = {
    ...baseSchema,
    ...routeSchema,
  };

  return mergedObjects;
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
): {
  value?: unknown;
  error?: StandardSchemaError | ZodError;
  schemasUsed: Array<StandardSchemaV1<unknown, unknown>>;
} => {
  const schemaStandard = parseAsStandardSchema(schema);

  if (!schemaStandard) {
    return { value: data, schemasUsed: [] };
  }

  const result = validateAgainstStandardSchema(data, schemaStandard, {
    passThroughExtraKeys,
  });

  return {
    ...result,
    schemasUsed: [schemaStandard],
  };
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
