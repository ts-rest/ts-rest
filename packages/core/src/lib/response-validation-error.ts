import { z } from 'zod';
import { AppRoute } from './dsl';

export class ResponseValidationError extends Error {
  constructor(
    public appRoute: AppRoute,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - node wants us to override this
    public cause: z.ZodError,
  ) {
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${cause.message}`,
    );
  }
}
