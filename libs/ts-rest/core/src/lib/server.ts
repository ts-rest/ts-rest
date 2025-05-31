import { HTTPStatusCode } from './status-codes';
import {
  ResponseValidationError,
  TsRestResponseValidationError,
} from './response-validation-error';
import {
  AppRoute,
  ContractAnyType,
  ContractNoBody,
  ContractNoBodyType,
  ContractOtherResponse,
} from './dsl';
import {
  areAllSchemasLegacyZod,
  parseAsStandardSchema,
  validateIfSchema,
} from './standard-schema-utils';
import { type ZodError } from 'zod';
import { StandardSchemaError } from './validation-error';

export const isAppRouteResponse = (
  value: unknown,
): value is { status: HTTPStatusCode; body?: any } => {
  return (
    value != null &&
    typeof value === 'object' &&
    'status' in value &&
    typeof value.status === 'number'
  );
};

export const isAppRouteOtherResponse = (
  response:
    | ContractAnyType
    | ContractNoBodyType
    | ContractOtherResponse<ContractAnyType>,
): response is ContractOtherResponse<ContractAnyType> => {
  return (
    response != null &&
    typeof response === 'object' &&
    'contentType' in response
  );
};

export const isAppRouteNoBody = (
  response:
    | ContractAnyType
    | ContractNoBodyType
    | ContractOtherResponse<ContractAnyType>,
): response is ContractNoBodyType => {
  return response === ContractNoBody;
};

export const validateResponse = ({
  appRoute,
  response,
}: {
  appRoute: AppRoute;
  response: { status: number; body?: unknown };
}): { status: number; body?: unknown } => {
  if (isAppRouteResponse(response)) {
    const responseType = appRoute.responses[response.status];

    const responseSchema = isAppRouteOtherResponse(responseType)
      ? responseType.body
      : responseType;

    const responseStandardSchema = parseAsStandardSchema(responseSchema);
    const responseValidation = validateIfSchema(
      response.body,
      responseStandardSchema,
    );

    if (responseValidation.error) {
      const isZodSchema = areAllSchemasLegacyZod([responseStandardSchema]);

      if (isZodSchema) {
        throw new ResponseValidationError(
          appRoute,
          responseValidation.error as ZodError,
        );
      } else {
        throw new TsRestResponseValidationError(
          appRoute,
          responseValidation.error as StandardSchemaError,
        );
      }
    }

    return {
      status: response.status,
      body: responseValidation.value,
    };
  }

  return response;
};
