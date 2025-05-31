import {
  RequestValidationErrorSchemaWithoutMessage,
  StandardSchemaError,
  ZodErrorSchema,
} from '@ts-rest/core';
import { type ZodError } from 'zod';

export class RequestValidationError extends Error {
  constructor(
    public pathParams: ZodError | StandardSchemaError | null,
    public headers: ZodError | StandardSchemaError | null,
    public query: ZodError | StandardSchemaError | null,
    public body: ZodError | StandardSchemaError | null,
  ) {
    super('[ts-rest] request validation failed');
  }
}

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const DefaultRequestValidationErrorSchema: typeof ZodErrorSchema =
  ZodErrorSchema;

/**
 * Schema was added in https://github.com/ts-rest/ts-rest/pull/601
 *
 * @deprecated supports zod 3, does not support other validators, you can bring your own schema, from next major version this will be removed
 */
export const CombinedRequestValidationErrorSchema: typeof RequestValidationErrorSchemaWithoutMessage =
  RequestValidationErrorSchemaWithoutMessage;
