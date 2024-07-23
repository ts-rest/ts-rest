import type { Context } from 'aws-lambda';
import { AppRouter } from '@ts-rest/core';
import {
  ApiGatewayEvent,
  ApiGatewayResponse,
  requestFromEvent,
  responseToResult,
} from '../mappers/aws/api-gateway';
import { createServerlessRouter } from '../router';
import {
  createTsr,
  RouterImplementationOrFluentRouter,
  ServerlessHandlerOptions,
} from '../types';

type LambdaPlatformArgs = {
  rawEvent: ApiGatewayEvent;
  lambdaContext: Context;
};

export const tsr = createTsr<LambdaPlatformArgs>();

export type LambdaHandlerOptions<TRequestExtension = {}> =
  ServerlessHandlerOptions<LambdaPlatformArgs, TRequestExtension>;

export const createLambdaHandler = <T extends AppRouter, TRequestExtension>(
  contract: T,
  router: RouterImplementationOrFluentRouter<
    T,
    LambdaPlatformArgs,
    TRequestExtension
  >,
  options: LambdaHandlerOptions<TRequestExtension> = {},
) => {
  const serverlessRouter = createServerlessRouter<
    T,
    LambdaPlatformArgs,
    TRequestExtension
  >(contract, router, options);

  return async (
    event: ApiGatewayEvent,
    context: Context,
  ): Promise<ApiGatewayResponse> => {
    const request = requestFromEvent(event);

    return serverlessRouter
      .fetch(request, {
        rawEvent: event,
        lambdaContext: context,
      })
      .then(async (response) => {
        return responseToResult(event, response);
      });
  };
};
