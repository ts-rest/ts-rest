import { ZodInputOrType } from './type-utils';
import { HTTPStatusCode } from './status-codes';
import { checkZodSchema } from './zod-utils';
import { ResponseValidationError } from './response-validation-error';

export type ApiRouteServerResponse<
  T extends Record<number, unknown>,
  TStrictStatusCodes = false
> =
  | {
      [K in keyof T]: {
        status: K;
        body: ZodInputOrType<T[K]>;
      };
    }[keyof T]
  | (TStrictStatusCodes extends true
      ? never
      : {
          status: Exclude<HTTPStatusCode, keyof T>;
          body: unknown;
        });

export const isAppRouteResponse = (
  value: unknown
): value is { status: HTTPStatusCode; body?: any } => {
  return (
    value != null &&
    typeof value === 'object' &&
    'status' in value &&
    typeof value.status === 'number'
  );
};

export const validateResponse = ({
  responseType,
  response,
}: {
  responseType: unknown;
  response: { status: number; body?: unknown };
}): { status: number; body?: unknown } => {
  if (isAppRouteResponse(response)) {
    const { body } = response;

    const responseValidation = checkZodSchema(body, responseType);

    if (!responseValidation.success) {
      const { error } = responseValidation;

      throw new ResponseValidationError(error);
    }

    return {
      status: response.status,
      body: responseValidation.data,
    };
  }

  return response;
};
