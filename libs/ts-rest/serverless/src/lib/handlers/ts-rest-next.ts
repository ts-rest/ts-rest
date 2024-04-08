import { AppRouter } from '@ts-rest/core';
import type { NextRequest, NextResponse } from 'next/server';
import { createServerlessRouter } from '../router';
import { RecursiveRouterObj, ServerlessHandlerOptions } from '../types';
import { TsRestRequest } from '../request';

type NextPlatformArgs = {
  nextRequest: NextRequest;
};

export const tsr = {
  router: <T extends AppRouter, TRequestExtension>(
    contract: T,
    router: RecursiveRouterObj<T, NextPlatformArgs, TRequestExtension>,
  ) => router,
};

export type NextHandlerOptions<TRequestExtension> = ServerlessHandlerOptions<
  NextPlatformArgs,
  TRequestExtension
> & {
  handlerType: 'app-router' | 'pages-router-edge';
};

export const createNextHandler = <T extends AppRouter, TRequestExtension>(
  contract: T,
  router: RecursiveRouterObj<T, NextPlatformArgs, TRequestExtension>,
  options: NextHandlerOptions<TRequestExtension>,
) => {
  const serverlessRouter = createServerlessRouter<
    T,
    NextPlatformArgs,
    TRequestExtension
  >(contract, router, options as ServerlessHandlerOptions);

  return async (nextRequest: NextRequest): Promise<NextResponse> => {
    if (options.handlerType === 'pages-router-edge') {
      if (!nextRequest.nextUrl.searchParams.has('ts-rest')) {
        throw new Error(
          'Please make sure your catch-all route file is named [...ts-rest]',
        );
      }

      nextRequest.nextUrl.searchParams.delete('ts-rest');
    }

    const request = new TsRestRequest(
      nextRequest.nextUrl.toString(),
      nextRequest,
    );

    return serverlessRouter.fetch(request, {
      nextRequest,
    });
  };
};
