import {
  AppRoute,
  AppRouter,
  ServerInferRequest,
  ServerInferResponses,
  StandardSchemaError,
} from '@ts-rest/core';
import { TsRestRequest } from './request';
import { TsRestHttpError } from './http-error';
import { TsRestResponse } from './response';
import { CorsOptions, RequestHandler } from 'itty-router';
import { CompleteRouter, RouterBuilder } from './router-builder';
import { type ZodError } from 'zod';

export class TsRestRequestValidationError extends TsRestHttpError {
  constructor(
    public pathParamsError: StandardSchemaError | null,
    public headersError: StandardSchemaError | null,
    public queryError: StandardSchemaError | null,
    public bodyError: StandardSchemaError | null,
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

/**
 * @deprecated use TsRestRequestValidationError instead, this will be removed in v4
 */
export class RequestValidationError extends TsRestHttpError {
  constructor(
    public pathParamsError: ZodError | null,
    public headersError: ZodError | null,
    public queryError: ZodError | null,
    public bodyError: ZodError | null,
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

export { RequestValidationErrorSchema } from '@ts-rest/core';

export class ResponseValidationError extends TsRestHttpError {
  constructor(
    public appRoute: AppRoute,
    public error: StandardSchemaError,
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

export const isRouterImplementation = <
  T extends AppRouter,
  TPlatformArgs,
  TRequestExtension,
>(
  obj:
    | RouterImplementation<T, TPlatformArgs, TRequestExtension>
    | AppRouteImplementationOrOptions<any, TPlatformArgs, TRequestExtension>,
): obj is RouterImplementation<T, TPlatformArgs, TRequestExtension> => {
  return typeof obj === 'object' && typeof obj?.handler !== 'function';
};

export type RouterImplementation<
  T extends AppRouter,
  TPlatformArgs,
  TRequestExtension,
> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RouterImplementation<T[TKey], TPlatformArgs, TRequestExtension>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey], TPlatformArgs, TRequestExtension>
    : never;
};

export type RouterImplementationOrFluentRouter<
  T extends AppRouter,
  TPlatformArgs,
  TRequestExtension,
> =
  | RouterImplementation<T, TPlatformArgs, TRequestExtension>
  | CompleteRouter<T, TPlatformArgs, TRequestExtension>;

export type ServerlessHandlerOptions<
  TPlatformArgs = {},
  TRequestExtension = {},
> = {
  jsonQuery?: boolean;
  responseValidation?: boolean;
  errorHandler?: (
    err: unknown,
    req: TsRestRequest,
    args: TPlatformArgs,
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
  router: <
    T extends AppRouter,
    TRequestExtension = {},
    TRouter extends RouterImplementation<
      T,
      TPlatformContext,
      TRequestExtension
    > = RouterImplementation<T, TPlatformContext, TRequestExtension>,
  >(
    contract: T,
    router: TRouter,
  ) => router,
  routerWithMiddleware:
    <T extends AppRouter>(contract: T) =>
    <
      TRequestExtension,
      TRouter extends RouterImplementation<
        T,
        TPlatformContext,
        TRequestExtension
      > = RouterImplementation<T, TPlatformContext, TRequestExtension>,
    >(
      router: TRouter,
    ) =>
      router,
  routerBuilder: <T extends AppRouter>(contract: T) => {
    return new RouterBuilder<T, TPlatformContext, {}>(contract);
  },
  route: <
    T extends AppRoute,
    TRequestExtension = {},
    TRoute extends AppRouteImplementationOrOptions<
      T,
      TPlatformContext,
      TRequestExtension
    > = AppRouteImplementationOrOptions<T, TPlatformContext, TRequestExtension>,
  >(
    contractEndpoint: T,
    route: TRoute,
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
  middleware: <
    TRequestExtension,
    TMiddleware extends RequestHandler<
      TsRestRequest & TRequestExtension,
      [TPlatformContext]
    > = RequestHandler<TsRestRequest & TRequestExtension, [TPlatformContext]>,
  >(
    middleware: TMiddleware,
  ) => middleware,
});
