import type { Context } from 'aws-lambda';
import { AppRouter } from '@ts-rest/core';
import {
  ApiGatewayEvent,
  ApiGatewayResponse,
  requestFromEvent,
  responseToResult,
} from './mappers/aws/api-gateway';
import { createServerlessRouter, serverlessErrorHandler } from './router';
import { RecursiveRouterObj, ServerlessHandlerOptions } from './types';

type LambdaPlatformArgs = {
  requestContext: ApiGatewayEvent['requestContext'];
  lambdaContext: Context;
};

export const createLambdaHandler = <T extends AppRouter>(
  routes: T,
  obj: RecursiveRouterObj<T, LambdaPlatformArgs>,
  options: ServerlessHandlerOptions = {}
) => {
  const router = createServerlessRouter<LambdaPlatformArgs, T>(
    routes,
    obj,
    options
  );

  return async (
    event: ApiGatewayEvent,
    context: Context
  ): Promise<ApiGatewayResponse> => {
    const request = requestFromEvent(event);

    return router
      .handle(request, {
        requestContext: event.requestContext,
        lambdaContext: context,
      })
      .then(async (response) => {
        return responseToResult(event, response);
      })
      .catch(async (err) => {
        const response = await serverlessErrorHandler(err, request, options);
        return responseToResult(event, response);
      });
  };
};
