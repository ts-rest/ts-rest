import { AppRoute } from './dsl';
import { ErrorResponse } from './infer-types';
import { ErrorHttpStatusCode } from './status-codes';

export class ErrorStatusResponseError<
  TAppRoute extends AppRoute,
  TErrorStatus extends ErrorHttpStatusCode = ErrorHttpStatusCode,
> extends Error {
  constructor(
    public readonly route: TAppRoute,
    public readonly response: ErrorResponse<TAppRoute, TErrorStatus>,
    public readonly request: unknown,
  ) {
    super(`Request failed with status ${response.status}`);
  }
}

/**
 * Check if the given `error` is an instance of {@link ErrorStatusResponseError}
 * and corresponds to the given `route` and matches the given `status`.
 *
 * @param route The route to check against
 * @param status The status to check against.
 *
 * - For single status it narrows down to a single response.
 * - Array of status codes it creates a union type of all the responses that match the status codes.
 * - If no given status, it will narrow to all error responses in the route.
 */
export function isErrorStatusResponse<
  TAppRoute extends AppRoute,
  TErrorStatus extends ErrorHttpStatusCode = ErrorHttpStatusCode,
>(
  error: unknown,
  route: TAppRoute,
  status?: TErrorStatus | TErrorStatus[],
): error is ErrorStatusResponseError<
  TAppRoute,
  TErrorStatus extends undefined ? ErrorHttpStatusCode : TErrorStatus
> {
  if (error == null) return false;
  if (!(error instanceof ErrorStatusResponseError)) return false;

  const errorStatusResponseError = error as ErrorStatusResponseError<
    AppRoute,
    ErrorHttpStatusCode
  >;

  if (errorStatusResponseError.route.path !== route.path) return false;

  if (status == null) return true;
  return Array.isArray(status)
    ? status.includes(error.response.status)
    : error.response.status === status;
}
