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
  RecursiveRouterObj,
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
  routes: T,
  obj: RecursiveRouterObj<T, AzureFunctionPlatformArgs, TRequestExtension>,
  options: AzureFunctionHandlerOptions<TRequestExtension> = {},
) => {
  const router = createServerlessRouter<
    T,
    AzureFunctionPlatformArgs,
    TRequestExtension
  >(routes, obj, options as ServerlessHandlerOptions);

  return async (
    httpRequest: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponse> => {
    const request = await requestFromHttpRequest(httpRequest);

    return router
      .fetch(request, {
        rawHttpRequest: httpRequest,
        azureContext: context,
      })
      .then(async (response) => {
        return responseToHttpResponse(response);
      });
  };
};
