import { AppRouter } from '@ts-rest/core';
import { createServerlessRouter, serverlessErrorHandler } from './router';
import { RecursiveRouterObj, ServerlessHandlerOptions } from './types';
import { TsRestRequest } from './request';

export const tsr = () => {
  return {
    router: <T extends AppRouter>(
      contract: T,
      router: RecursiveRouterObj<T, {}>
    ) => router,
  };
};

export const fetchRequestHandler = <T extends AppRouter>({
  contract,
  router,
  options = {},
  request,
}: {
  contract: T;
  router: RecursiveRouterObj<T, {}>;
  options: ServerlessHandlerOptions;
  request: Request;
}) => {
  const serverlessRouter = createServerlessRouter<T, {}>(
    contract,
    router,
    options
  );
  const tsRestRequest = new TsRestRequest(request);
  return serverlessRouter.handle(tsRestRequest, {}).catch(async (err) => {
    return serverlessErrorHandler(err, tsRestRequest, options);
  });
};
