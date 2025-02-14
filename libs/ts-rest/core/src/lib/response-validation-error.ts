import { AppRoute } from './dsl';
import { StandardSchemaV1 } from './standard-schema';

export class ResponseValidationError extends Error {
  constructor(
    public appRoute: AppRoute,
    // breaking: cause: z.ZodError -> issues: ReadonlyArray<StandardSchemaV1.Issue>
    public issues: ReadonlyArray<StandardSchemaV1.Issue>,
  ) {
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
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${message}`,
    );
  }
}
