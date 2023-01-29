import { applyDecorators } from '@nestjs/common';
import { JsonQuery } from './json-query.decorator';
import { ValidateResponses } from './validate-responses.decorator';

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
    decorators.push(ValidateResponses(options.validateResponses));
  }

  return applyDecorators(...decorators);
};
