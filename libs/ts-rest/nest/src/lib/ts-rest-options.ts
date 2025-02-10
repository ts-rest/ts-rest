import { TsRestOptionsMetadataKey } from './constants';
import { ExecutionContext } from '@nestjs/common';

export type TsRestOptions = {
  jsonQuery?: boolean;
  validateResponses?: boolean;
  validateRequestHeaders?: boolean;
  validateRequestQuery?: boolean;
  validateRequestBody?: boolean;
};

export type EvaluatedTsRestOptions = Required<TsRestOptions>;
export type MaybeTsRestOptions = TsRestOptions | undefined | null;

const defaultOptions = {
  jsonQuery: false,
  validateResponses: false,
  validateRequestHeaders: true,
  validateRequestQuery: true,
  validateRequestBody: true,
} satisfies EvaluatedTsRestOptions;

export const evaluateTsRestOptions = (
  globalOptions: MaybeTsRestOptions,
  context: ExecutionContext,
): EvaluatedTsRestOptions => {
  const handlerOptions = Reflect.getMetadata(
    TsRestOptionsMetadataKey,
    context.getHandler(),
  ) as MaybeTsRestOptions;

  console.log('handlerOptions', handlerOptions);

  const classOptions = Reflect.getMetadata(
    TsRestOptionsMetadataKey,
    context.getClass(),
  ) as MaybeTsRestOptions;

  console.log('classOptions', classOptions);

  return {
    ...defaultOptions,
    ...globalOptions,
    ...classOptions,
    ...handlerOptions,
  };
};
