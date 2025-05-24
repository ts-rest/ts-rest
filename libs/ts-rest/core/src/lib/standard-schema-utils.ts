import { ZodError, ZodSchema } from 'zod';
import { ContractAnyType } from './dsl';
import { StandardSchemaV1 } from './standard-schema';
import { StandardSchemaError } from './validation-error';
import { zodMerge } from './zod-utils';

export const isStandardSchema = (
  schema: unknown,
): schema is StandardSchemaV1 => {
  const standard = (schema as StandardSchemaV1)?.['~standard'];

  if (!standard) {
    return false;
  }

  return standard.version === 1 && typeof standard.validate === 'function';
};

export const checkStandardSchema = (
  data: unknown,
  schema: unknown,
  { passThroughExtraKeys = false } = {},
) => {
  if (schema === null || schema === undefined) {
    return {
      value: data,
    };
  }

  if (!isStandardSchema(schema)) {
    throw new TypeError(
      'Unable to check schema, does not conform to StandardSchemaV1',
    );
  }

  /**
   * To avoid breaking change, if someone using zod 3 (which they must be if they're pre-standard-schema) we return a ZodError.
   * Otherwise, move onto our new StandardSchemaError.
   */
  const isZod3 = schema['~standard'].vendor === 'zod' && !('_zod' in schema);
  if (isZod3) {
    const result = (schema as ZodSchema).safeParse(data);

    if (!result.success) {
      return {
        error: new ZodError(result.error.issues),
      };
    }

    return {
      value:
        passThroughExtraKeys && typeof data === 'object'
          ? { ...data, ...result.data }
          : result.data,
    };
  }

  const result = schema['~standard'].validate(data);

  if (result instanceof Promise) {
    throw new TypeError('Schema validation must be synchronous');
  }

  if (result.issues) {
    return {
      error: new StandardSchemaError(result.issues),
    };
  }

  return {
    value:
      passThroughExtraKeys &&
      typeof data === 'object' &&
      result.value &&
      typeof result.value === 'object'
        ? { ...data, ...result.value }
        : result.value,
  };
};

export const parseStandardSchema = (
  data: unknown,
  schema: unknown,
  { passThroughExtraKeys = false } = {},
) => {
  const result = checkStandardSchema(data, schema, { passThroughExtraKeys });

  if (result.error) {
    throw result.error;
  }

  return result.value;
};

const STANDARD_SCHEMA_MERGERS: Record<string, TsRestStandardSchemaMerger> = {
  zod: zodMerge as TsRestStandardSchemaMerger,
};

export type TsRestStandardSchemaMerger = (
  a: StandardSchemaV1,
  b: StandardSchemaV1,
) => StandardSchemaV1;

export const configureStandardSchemaMerger = (
  vendor: string,
  merger: TsRestStandardSchemaMerger,
) => {
  STANDARD_SCHEMA_MERGERS[vendor] = merger;
};

export const mergeStandardSchema = (
  a?: ContractAnyType,
  b?: ContractAnyType,
): ContractAnyType | undefined => {
  if (a === b) {
    return a;
  }

  if (
    (a !== undefined && !isStandardSchema(a)) ||
    (b !== undefined && !isStandardSchema(b))
  ) {
    throw new Error(
      'Cannot mix plain object types with StandardSchemaV1 objects',
    );
  }

  if (!a || !b) {
    return a || b;
  }

  if (
    a['~standard'].vendor === b['~standard'].vendor &&
    STANDARD_SCHEMA_MERGERS[a['~standard'].vendor]
  ) {
    return STANDARD_SCHEMA_MERGERS[a['~standard'].vendor](a, b);
  }

  return {
    '~standard': {
      version: 1,
      vendor: 'ts-rest',
      validate: (value) => {
        const aResult = a['~standard'].validate(value);
        const bResult = b['~standard'].validate(value);

        if (aResult instanceof Promise || bResult instanceof Promise) {
          throw new TypeError('Schema validation must be synchronous');
        }

        if (aResult.issues || bResult.issues) {
          return {
            issues: [...(aResult.issues || []), ...(bResult.issues || [])],
          };
        }

        return {
          value: Object.assign({}, aResult.value, bResult.value),
        };
      },
    },
  };
};
