import { AppRouter } from '@ts-rest/core';
import type { NextRequest, NextResponse } from 'next/server';
import { createServerlessRouter, serverlessErrorHandler } from '../router';
import { RecursiveRouterObj, ServerlessHandlerOptions } from '../types';
import { TsRestRequest } from '../request';

type NextPlatformArgs = {
  nextRequest: NextRequest;
};

export const tsr = {
  router: <T extends AppRouter>(
    contract: T,
    router: RecursiveRouterObj<T, NextPlatformArgs>,
  ) => router,
};

export type NextHandlerOptions = ServerlessHandlerOptions & {
  handlerType: 'app-router' | 'pages-router-edge';
};

export const createNextHandler = <T extends AppRouter>(
  contract: T,
  router: RecursiveRouterObj<T, {}>,
  options: NextHandlerOptions,
) => {
  const serverlessRouter = createServerlessRouter<T, NextPlatformArgs>(
    contract,
    router,
    options,
  );

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

    return serverlessRouter
      .handle(request, {
        nextRequest,
      })
      .catch(async (err) => {
        return serverlessErrorHandler(err, request, options);
      });
  };
};
