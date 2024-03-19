import type { z } from 'zod';
import {
  AppRoute,
  AppRouter,
  ServerInferRequest,
  ServerInferResponses,
} from '@ts-rest/core';
import { TsRestRequest } from './request';
import { CorsConfig } from './cors';
import { TsRestHttpError } from './http-error';
import { TsRestResponse } from './response';

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

export type AppRouteImplementation<T extends AppRoute, TPlatformArgs> = (
  args: ServerInferRequest<T>,
  context: TPlatformArgs & {
    appRoute: T;
    request: TsRestRequest;
    responseHeaders: Headers;
  },
) => Promise<ServerInferResponses<T>>;

export type RecursiveRouterObj<T extends AppRouter, TPlatformArgs> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey], TPlatformArgs>
    : T[TKey] extends AppRoute
    ? AppRouteImplementation<T[TKey], TPlatformArgs>
    : never;
};

export type ServerlessHandlerOptions = {
  jsonQuery?: boolean;
  responseValidation?: boolean;
  errorHandler?: (
    err: unknown,
    req: TsRestRequest,
  ) => TsRestResponse | Promise<TsRestResponse> | void | Promise<void>;
  cors?: CorsConfig;
  basePath?: string;
};
