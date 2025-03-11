import { z, ZodError } from 'zod';
import { StandardSchemaV1 } from './standard-schema';
import { ZodErrorSchema } from './zod-utils';

export class StandardSchemaError
  extends Error
  implements StandardSchemaV1.FailureResult
{
  public readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    /*
      Internally the ZodError message property serializes the issues to json
      with a custom formatter that stringifies bigints. To keep the behavior
      as similar as possible we can replicate that here.
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

export type ValidationError = ZodError | StandardSchemaError;

/*
  Convert a ValidationError to a plain object because ValidationError extends
  Error and causes problems with NestJS.
*/
export const validationErrorResponse = (
  error: ValidationError,
): Pick<ValidationError, 'name' | 'issues'> => {
  return {
    name: error.name,
    issues: error.issues,
  };
};

const ValidationErrorSchemaInternal = z.union([
  ZodErrorSchema,
  z.object({
    name: z.literal('ValidationError'),
    issues: z
      .array(
        z.object({
          message: z.string(),
          path: z
            .array(
              z.union([
                z.union([z.string(), z.number(), z.symbol()]),
                z
                  .object({
                    key: z.union([z.string(), z.number(), z.symbol()]),
                  })
                  .readonly(),
              ]),
            )
            .readonly()
            .optional(),
        }),
      )
      .readonly(),
  }),
]);
type ValidationErrorInternal =
  | ZodError
  | {
      readonly name: 'ValidationError';
      readonly issues: readonly StandardSchemaV1.Issue[];
    };
export const ValidationErrorSchema =
  ValidationErrorSchemaInternal as StandardSchemaV1<
    unknown,
    ValidationErrorInternal
  >;

export const RequestValidationErrorSchema = z.object({
  message: z.literal('Request validation failed').optional(),
  pathParameterErrors: ValidationErrorSchemaInternal.nullable(),
  headerErrors: ValidationErrorSchemaInternal.nullable(),
  queryParameterErrors: ValidationErrorSchemaInternal.nullable(),
  bodyErrors: ValidationErrorSchemaInternal.nullable(),
}) as StandardSchemaV1<
  unknown,
  {
    message?: 'Request validation failed';
    pathParameterErrors: ValidationErrorInternal | null;
    headerErrors: ValidationErrorInternal | null;
    queryParameterErrors: ValidationErrorInternal | null;
    bodyErrors: ValidationErrorInternal | null;
  }
>;

/** @deprecated prefer RequestValidationErrorSchema from @ts-rest/core */
export const RequestValidationErrorSchemaForNest = z.object({
  paramsResult: ValidationErrorSchemaInternal.nullable(),
  headersResult: ValidationErrorSchemaInternal.nullable(),
  queryResult: ValidationErrorSchemaInternal.nullable(),
  bodyResult: ValidationErrorSchemaInternal.nullable(),
}) as StandardSchemaV1<
  unknown,
  {
    paramsResult: ValidationErrorInternal | null;
    headersResult: ValidationErrorInternal | null;
    queryResult: ValidationErrorInternal | null;
    bodyResult: ValidationErrorInternal | null;
  }
>;
