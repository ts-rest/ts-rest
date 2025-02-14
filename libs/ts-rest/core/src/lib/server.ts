import { HTTPStatusCode } from './status-codes';
import { ResponseValidationError } from './response-validation-error';
import {
  AppRoute,
  ContractAnyType,
  ContractNoBody,
  ContractNoBodyType,
  ContractOtherResponse,
} from './dsl';
import {
  checkStandardSchema,
  parseStandardSchema,
} from './standard-schema-utils';

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

    return {
      status: response.status,
      body: parseStandardSchema(appRoute, response.body, responseSchema),
    };
  }

  return response;
};
