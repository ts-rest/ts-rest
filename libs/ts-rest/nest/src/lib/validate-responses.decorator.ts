import { SetMetadata } from '@nestjs/common';

export const ValidateResponsesSymbol = Symbol('ts-rest-validate-responses');

export const ValidateResponses = (validateResponses = true) => {
  return SetMetadata(ValidateResponsesSymbol, validateResponses);
};
