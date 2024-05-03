import type { z } from 'zod';
import {
  AppRoute,
  AppRouter,
  ServerInferRequest,
  ServerInferResponses,
} from '@ts-rest/core';
import { TsRestRequest } from './request';
import { TsRestHttpError } from './http-error';
import { TsRestResponse } from './response';
import { CorsOptions, RequestHandler } from 'itty-router';

export class RequestValidationError extends TsRestHttpError {
  constructor(
    public pathParamsError: z.ZodError | null,
    public headersError: z.ZodError | null,
    public queryError: z.ZodError | null,
    public bodyError: z.ZodError | null,
  ) {
    super(400, {
      message: 'Request validation failed',
      pathParameterErrors: pathParamsError,
      headerErrors: headersError,
      queryParameterErrors: queryError,
      bodyErrors: bodyError,
    });
  }
}

export class ResponseValidationError extends TsRestHttpError {
  constructor(
    public appRoute: AppRoute,
    public error: z.ZodError,
  ) {
    super(500, {
      message: 'Server Error',
    });

    this.message = `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${error.message}`;
  }
}

export type AppRouteImplementation<
  T extends AppRoute,
  TPlatformArgs,
  TRequestExtension,
> = (
  args: ServerInferRequest<T>,
  context: TPlatformArgs & {
    appRoute: T;
    request: TsRestRequest & TRequestExtension;
    responseHeaders: Headers;
  },
) => Promise<ServerInferResponses<T>>;

export interface AppRouteOptions<
  TRoute extends AppRoute,
  TPlatformArgs,
  TRequestExtension,
> {
  middleware?: RequestHandler<
    TsRestRequest & TRequestExtension,
    [TPlatformArgs]
  >[];
  handler: AppRouteImplementation<TRoute, TPlatformArgs, TRequestExtension>;
}

export type AppRouteImplementationOrOptions<
  TRoute extends AppRoute,
  TPlatformArgs,
  TRequestExtension,
> =
  | AppRouteOptions<TRoute, TPlatformArgs, TRequestExtension>
  | AppRouteImplementation<TRoute, TPlatformArgs, TRequestExtension>;

export const isAppRouteImplementation = <
  TRoute extends AppRoute,
  TPlatformArgs,
  TRequestExtension,
>(
  obj: AppRouteImplementationOrOptions<
    TRoute,
    TPlatformArgs,
    TRequestExtension
  >,
): obj is AppRouteImplementation<TRoute, TPlatformArgs, TRequestExtension> => {
  return typeof obj === 'function';
};

export const isRecursiveRouterObj = <
  T extends AppRouter,
  TPlatformArgs,
  TRequestExtension,
>(
  obj:
    | RecursiveRouterObj<T, TPlatformArgs, TRequestExtension>
    | AppRouteImplementationOrOptions<any, TPlatformArgs, TRequestExtension>,
): obj is RecursiveRouterObj<T, TPlatformArgs, TRequestExtension> => {
  return typeof obj === 'object' && typeof obj?.handler !== 'function';
};

export type RecursiveRouterObj<
  T extends AppRouter,
  TPlatformArgs,
  TRequestExtension,
> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey], TPlatformArgs, TRequestExtension>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey], TPlatformArgs, TRequestExtension>
    : never;
};

export type ServerlessHandlerOptions<
  TPlatformArgs = {},
  TRequestExtension = {},
> = {
  jsonQuery?: boolean;
  responseValidation?: boolean;
  errorHandler?: (
    err: unknown,
    req: TsRestRequest,
  ) => TsRestResponse | Promise<TsRestResponse> | void | Promise<void>;
  cors?: CorsOptions | false;
  basePath?: string;
  requestMiddleware?: RequestHandler<
    TsRestRequest & TRequestExtension,
    [TPlatformArgs]
  >[];
  responseHandlers?: Array<
    (
      response: TsRestResponse,
      request: TsRestRequest & TRequestExtension,
      args: TPlatformArgs,
    ) => TsRestResponse | Promise<TsRestResponse> | void | Promise<void>
  >;
};

export const createTsr = <TPlatformContext = {}>() => ({
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
  routeWithMiddleware:
    <T extends AppRoute>(contractEndpoint: T) =>
    <TRequestGlobalExtension, TRequestLocalExtension>(
      route: AppRouteOptions<
        T,
        TPlatformContext,
        TRequestGlobalExtension & TRequestLocalExtension
      >,
    ) =>
      route as AppRouteOptions<T, TPlatformContext, TRequestGlobalExtension>,
  middleware: <TRequestExtension>(
    middleware: RequestHandler<
      TsRestRequest & TRequestExtension,
      [TPlatformContext]
    >,
  ) => middleware,
});
