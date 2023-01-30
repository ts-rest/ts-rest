import { z } from 'zod';

export class ResponseValidationError extends Error {
  cause: z.ZodError;

  constructor(cause: z.ZodError) {
    super('Response validation failed');

    this.cause = cause;
  }
}
