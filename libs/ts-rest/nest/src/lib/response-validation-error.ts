import { z } from 'zod';
import { InternalServerErrorException } from '@nestjs/common';

export class ResponseValidationError extends InternalServerErrorException {
  constructor(cause: z.ZodError) {
    super();

    this.cause = cause;
  }
}
