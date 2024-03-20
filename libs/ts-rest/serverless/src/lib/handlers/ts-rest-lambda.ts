import type { Context } from 'aws-lambda';
import { AppRouter } from '@ts-rest/core';
import {
  ApiGatewayEvent,
  ApiGatewayResponse,
  requestFromEvent,
  responseToResult,
} from '../mappers/aws/api-gateway';
import { createServerlessRouter, serverlessErrorHandler } from '../router';
import { RecursiveRouterObj, ServerlessHandlerOptions } from '../types';

type LambdaPlatformArgs = {
  rawEvent: ApiGatewayEvent;
  lambdaContext: Context;
};

export const tsr = {
  router: <T extends AppRouter>(
    contract: T,
    router: RecursiveRouterObj<T, LambdaPlatformArgs>,
  ) => router,
};

export const createLambdaHandler = <T extends AppRouter>(
  routes: T,
  obj: RecursiveRouterObj<T, LambdaPlatformArgs>,
  options: ServerlessHandlerOptions = {},
) => {
  const router = createServerlessRouter<T, LambdaPlatformArgs>(
    routes,
    obj,
    options,
  );

  return async (
    event: ApiGatewayEvent,
    context: Context,
  ): Promise<ApiGatewayResponse> => {
    const request = requestFromEvent(event);

    return router
      .handle(request, {
        rawEvent: event,
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
