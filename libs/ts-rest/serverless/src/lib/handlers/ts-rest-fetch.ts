import { AppRouter } from '@ts-rest/core';
import { createServerlessRouter } from '../router';
import {
  createTsr,
  RouterImplementationOrFluentRouter,
  ServerlessHandlerOptions,
} from '../types';
import { TsRestRequest } from '../request';

export const tsr = {
  ...createTsr(),
  platformContext: <TPlatformContext>() => createTsr<TPlatformContext>(),
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
  router: RouterImplementationOrFluentRouter<
    T,
    TPlatformContext,
    TRequestExtension
  >;
  options: FetchHandlerOptions<TPlatformContext, TRequestExtension>;
  request: Request;
  platformContext?: TPlatformContext;
}) => {
  const serverlessRouter = createServerlessRouter<
    T,
    TPlatformContext,
    TRequestExtension
  >(contract, router, options);
  const tsRestRequest = new TsRestRequest(request);
  return serverlessRouter.fetch(tsRestRequest, {
    ...platformContext,
  });
};
