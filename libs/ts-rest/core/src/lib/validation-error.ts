import { z, type ZodError } from 'zod';
import { StandardSchemaV1 } from './standard-schema';
import { ZodErrorSchema } from './zod-utils';

/**
 * The error class for standard schema validation errors.
 *
 * @see {@link StandardSchemaV1.FailureResult}
 */
export class StandardSchemaError
  extends Error
  implements StandardSchemaV1.FailureResult
{
  public readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    /**
     * Similar pattern to ZodError regarding bigints.
     */
    const message = JSON.stringify(
      issues,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2,
    );

    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }

  /*
    ZodError overrides the toString method to return the serialised message.
    The Next.js implementation relies on this behaviour.
  */
  override toString() {
    return this.message;
  }
}

/*
  Convert a ValidationError to a plain object because ValidationError extends
  Error and causes problems with NestJS.
*/
export const validationErrorResponse = (
  error: ZodError | StandardSchemaError,
): Pick<ZodError | StandardSchemaError, 'name' | 'issues'> => {
  return {
    name: error.name,
    issues: error.issues,
  };
};

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const RequestValidationErrorSchema = z.object({
  message: z.literal('Request validation failed'),
  pathParameterErrors: ZodErrorSchema.nullable(),
  headerErrors: ZodErrorSchema.nullable(),
  queryParameterErrors: ZodErrorSchema.nullable(),
  bodyErrors: ZodErrorSchema.nullable(),
});

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const RequestValidationErrorSchemaWithoutMessage = z.object({
  // No message, express never had this implemented
  pathParameterErrors: ZodErrorSchema.nullable(),
  headerErrors: ZodErrorSchema.nullable(),
  queryParameterErrors: ZodErrorSchema.nullable(),
  bodyErrors: ZodErrorSchema.nullable(),
});

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const RequestValidationErrorSchemaForNest = z.object({
  paramsResult: ZodErrorSchema.nullable(),
  headersResult: ZodErrorSchema.nullable(),
  queryResult: ZodErrorSchema.nullable(),
  bodyResult: ZodErrorSchema.nullable(),
});
