import { AppRouter } from '@ts-rest/core';
import { createServerlessRouter } from '../router';
import { RecursiveRouterObj, ServerlessHandlerOptions } from '../types';
import { TsRestRequest } from '../request';

export const tsr = {
  router: <T extends AppRouter, TRequestExtension>(
    contract: T,
    router: RecursiveRouterObj<T, {}, TRequestExtension>,
  ) => router,
};

export type FetchHandlerOptions<TRequestExtension = {}> =
  ServerlessHandlerOptions<{}, TRequestExtension>;

export const fetchRequestHandler = <T extends AppRouter, TRequestExtension>({
  contract,
  router,
  options = {},
  request,
}: {
  contract: T;
  router: RecursiveRouterObj<T, {}, TRequestExtension>;
  options: FetchHandlerOptions<TRequestExtension>;
  request: Request;
}) => {
  const serverlessRouter = createServerlessRouter<T, {}, TRequestExtension>(
    contract,
    router,
    options as ServerlessHandlerOptions,
  );
  const tsRestRequest = new TsRestRequest(request);
  return serverlessRouter.fetch(tsRestRequest, {});
};
