import {
  RequestValidationErrorSchema,
  RequestValidationErrorSchemaWithoutMessage,
  StandardSchemaError,
  ZodErrorSchema,
} from '@ts-rest/core';
import { type ZodError } from 'zod';

export class TsRestRequestValidationError extends Error {
  constructor(
    public pathParams: StandardSchemaError | null,
    public headers: StandardSchemaError | null,
    public query: StandardSchemaError | null,
    public body: StandardSchemaError | null,
  ) {
    super('[ts-rest] request validation failed');
  }
}

/**
 * @deprecated use TsRestRequestValidationError instead, this will be removed in v4
 */
export class RequestValidationError extends Error {
  constructor(
    public pathParams: ZodError | null,
    public headers: ZodError | null,
    public query: ZodError | null,
    public body: ZodError | null,
  ) {
    super('[ts-rest] request validation failed');
  }
}

export const DefaultRequestValidationErrorSchema: typeof ZodErrorSchema =
  ZodErrorSchema;

export const CombinedRequestValidationErrorSchema: typeof RequestValidationErrorSchemaWithoutMessage =
  RequestValidationErrorSchemaWithoutMessage;
