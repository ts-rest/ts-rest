import {
  RequestValidationErrorSchema,
  ValidationError,
  ValidationErrorSchema,
} from '@ts-rest/core';

export class RequestValidationError extends Error {
  constructor(
    public pathParams: ValidationError | null,
    public headers: ValidationError | null,
    public query: ValidationError | null,
    public body: ValidationError | null,
  ) {
    super('[ts-rest] request validation failed');
  }
}

export const DefaultRequestValidationErrorSchema = ValidationErrorSchema;

export const CombinedRequestValidationErrorSchema =
  RequestValidationErrorSchema;
