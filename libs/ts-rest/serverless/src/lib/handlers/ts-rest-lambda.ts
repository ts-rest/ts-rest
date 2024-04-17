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
  RecursiveRouterObj,
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
  routes: T,
  obj: RecursiveRouterObj<T, LambdaPlatformArgs, TRequestExtension>,
  options: LambdaHandlerOptions<TRequestExtension> = {},
) => {
  const router = createServerlessRouter<
    T,
    LambdaPlatformArgs,
    TRequestExtension
  >(routes, obj, options as ServerlessHandlerOptions);

  return async (
    event: ApiGatewayEvent,
    context: Context,
  ): Promise<ApiGatewayResponse> => {
    const request = requestFromEvent(event);

    return router
      .fetch(request, {
        rawEvent: event,
        lambdaContext: context,
      })
      .then(async (response) => {
        return responseToResult(event, response);
      });
  };
};
