import type {
  HttpRequest,
  HttpResponse,
  InvocationContext,
} from '@azure/functions';
import { AppRouter } from '@ts-rest/core';
import {
  requestFromHttpRequest,
  responseToHttpResponse,
} from '../mappers/azure/azure-function';
import { createServerlessRouter } from '../router';
import {
  createTsr,
  RouterImplementationOrFluentRouter,
  ServerlessHandlerOptions,
} from '../types';

type AzureFunctionPlatformArgs = {
  rawHttpRequest: HttpRequest;
  azureContext: InvocationContext;
};

export const tsr = createTsr<AzureFunctionPlatformArgs>();

export type AzureFunctionHandlerOptions<TRequestExtension = {}> =
  ServerlessHandlerOptions<AzureFunctionPlatformArgs, TRequestExtension>;

export const createAzureFunctionHandler = <
  T extends AppRouter,
  TRequestExtension,
>(
  contract: T,
  router: RouterImplementationOrFluentRouter<
    T,
    AzureFunctionPlatformArgs,
    TRequestExtension
  >,
  options: AzureFunctionHandlerOptions<TRequestExtension> = {},
) => {
  const serverlessRouter = createServerlessRouter<
    T,
    AzureFunctionPlatformArgs,
    TRequestExtension
  >(contract, router, options);

  return async (
    httpRequest: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponse> => {
    const request = await requestFromHttpRequest(httpRequest);

    return serverlessRouter
      .fetch(request, {
        rawHttpRequest: httpRequest,
        azureContext: context,
      })
      .then(async (response) => {
        return responseToHttpResponse(response);
      });
  };
};
