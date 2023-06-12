import type { z } from 'zod';
import {
  AppRoute,
  AppRouter,
  ServerInferRequest,
  ServerInferResponses,
} from '@ts-rest/core';
import { TsRestRequest } from './request';
import { TsRestResponseInit } from './response';
import { CorsConfig } from './cors';

export class RequestValidationError extends Error {
  constructor(
    public pathParams: z.ZodError | null,
    public headers: z.ZodError | null,
    public query: z.ZodError | null,
    public body: z.ZodError | null
  ) {
    super('[ts-rest] request validation failed');
  }
}

export type AppRouteImplementation<T extends AppRoute, TPlatformArgs> = (
  args: ServerInferRequest<T, Headers> &
    TPlatformArgs & {
      request: TsRestRequest;
    }
) => Promise<
  ServerInferResponses<T> & { headers?: TsRestResponseInit['headers'] }
>;

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
  requestValidationErrorHandler?: (
    err: RequestValidationError,
    req: TsRestRequest
  ) => TsRestResponseInit | Promise<TsRestResponseInit>;
  errorHandler?: (
    err: unknown,
    req: TsRestRequest
  ) => TsRestResponseInit | Promise<TsRestResponseInit>;
  cors?: CorsConfig;
};
