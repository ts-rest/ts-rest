import { AppRoute, AppRouter } from '@ts-rest/core';
import { createServerlessRouter } from '../router';
import {
  AppRouteImplementationOrOptions,
  RecursiveRouterObj,
  ServerlessHandlerOptions,
} from '../types';
import { TsRestRequest } from '../request';

export const tsr = {
  router: <T extends AppRouter, TPlatformContext = {}, TRequestExtension = {}>(
    contract: T,
    router: RecursiveRouterObj<T, TPlatformContext, TRequestExtension>,
  ) => router,
  route: <T extends AppRoute, TPlatformContext = {}, TRequestExtension = {}>(
    contractEndpoint: T,
    route: AppRouteImplementationOrOptions<
      T,
      TPlatformContext,
      TRequestExtension
    >,
  ) => route,
  platformContext: <TPlatformContext>() => ({
    router: <T extends AppRouter, TRequestExtension = {}>(
      contract: T,
      router: RecursiveRouterObj<T, TPlatformContext, TRequestExtension>,
    ) => router,
    route: <T extends AppRoute, TRequestExtension = {}>(
      contractEndpoint: T,
      route: AppRouteImplementationOrOptions<
        T,
        TPlatformContext,
        TRequestExtension
      >,
    ) => route,
  }),
};

export type FetchHandlerOptions<
  TPlatformContext = {},
  TRequestExtension = {},
> = ServerlessHandlerOptions<TPlatformContext, TRequestExtension>;

export const fetchRequestHandler = <
  T extends AppRouter,
  TRequestExtension,
  TPlatformContext = {},
>({
  contract,
  router,
  options = {},
  request,
  platformContext,
}: {
  contract: T;
  router: RecursiveRouterObj<T, TPlatformContext, TRequestExtension>;
  options: FetchHandlerOptions<TPlatformContext, TRequestExtension>;
  request: Request;
  platformContext?: TPlatformContext;
}) => {
  const serverlessRouter = createServerlessRouter<
    T,
    TPlatformContext,
    TRequestExtension
  >(contract, router, options as ServerlessHandlerOptions<TPlatformContext>);
  const tsRestRequest = new TsRestRequest(request);
  return serverlessRouter.fetch(tsRestRequest, {
    ...platformContext,
  });
};
