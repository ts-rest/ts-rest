import type { Context } from 'aws-lambda';
import type { AppRouter } from '@ts-rest/core';
import type {
  ApiGatewayEvent,
  ApiGatewayResponse,
} from '../mappers/aws/api-gateway';
import {
  isV2,
  requestFromEvent as apiGatewayRequestFromEvent,
  responseToResult as apiGatewayResponseToResult,
} from '../mappers/aws/api-gateway';
import type {
  AlbEvent,
  AlbResponse,
} from '../mappers/aws/alb';
import {
  isAlbEvent,
  requestFromEvent as albRequestFromEvent,
  responseToResult as albResponseToResult,
} from '../mappers/aws/alb';
import { createServerlessRouter } from '../router';
import type {
  RouterImplementationOrFluentRouter,
  ServerlessHandlerOptions,
} from '../types';
import { createTsr } from '../types';

type EventType = ApiGatewayEvent | AlbEvent;
type ResponseType = ApiGatewayResponse | AlbResponse;

type LambdaPlatformArgs = {
  rawEvent: EventType;
  lambdaContext: Context;
};

export const tsr = createTsr<LambdaPlatformArgs>();

export type LambdaHandlerOptions<TRequestExtension = Record<string, unknown>> =
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
    event: EventType,
    context: Context,
  ): Promise<ResponseType> => {
    const request = isAlbEvent(event)
      ? albRequestFromEvent(event as AlbEvent)
      : apiGatewayRequestFromEvent(event as ApiGatewayEvent);

    const response = await serverlessRouter.fetch(request, {
      rawEvent: event,
      lambdaContext: context,
    });

    if (isAlbEvent(event)) {
      return albResponseToResult(response);
    }

    return apiGatewayResponseToResult(event as ApiGatewayEvent, response);
  };
};
