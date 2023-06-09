import { HTTPStatusCode } from './status-codes';
import { checkZodSchema } from './zod-utils';
import { ResponseValidationError } from './response-validation-error';
import { ContractAnyType, ContractOtherResponse } from './dsl';

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

export const isAppRouteOtherResponse = (
  response: ContractAnyType | ContractOtherResponse<ContractAnyType>
): response is ContractOtherResponse<ContractAnyType> => {
  return (
    response != null &&
    typeof response === 'object' &&
    'contentType' in response
  );
};

export const validateResponse = ({
  responseType,
  response,
}: {
  responseType: ContractAnyType | ContractOtherResponse<ContractAnyType>;
  response: { status: number; body?: unknown };
}): { status: number; body?: unknown } => {
  if (isAppRouteResponse(response)) {
    const { body } = response;

    const responseSchema = isAppRouteOtherResponse(responseType)
      ? responseType.body
      : responseType;

    const responseValidation = checkZodSchema(body, responseSchema);

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
