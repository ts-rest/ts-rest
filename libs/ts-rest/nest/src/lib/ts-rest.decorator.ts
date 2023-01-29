import { applyDecorators, SetMetadata } from '@nestjs/common';
import { JsonQuery } from './json-query.decorator';

export const ValidateResponsesSymbol = Symbol('ts-rest-validate-responses');

/**
 * TsRest NestJS options
 */
export const TsRest = (options: {
  jsonQuery?: boolean;
  validateResponses?: boolean;
}) => {
  const decorators = [];

  if (options.jsonQuery !== undefined) {
    decorators.push(JsonQuery(options.jsonQuery));
  }

  if (options.validateResponses !== undefined) {
    decorators.push(
      SetMetadata(ValidateResponsesSymbol, options.validateResponses)
    );
  }

  return applyDecorators(...decorators);
};
