import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  ServerInferRequest,
  ServerInferResponses,
} from '@ts-rest/core';
import { Express, NextFunction, Response } from 'express-serve-static-core';
import { RequestValidationError } from './request-validation-error';

type AppRouteQueryImplementation<
  T extends AppRouteQuery,
  TRequest extends ServerInferRequest<T> = ServerInferRequest<T>
> = (
  input: Omit<TRequest, 'body' | 'headers'> & {
    headers: TRequest['headers'] & Express['request']['headers'];
    req: TsRestRequest<T>;
    res: Response;
  }
) => Promise<ServerInferResponses<T>>;

type AppRouteMutationImplementation<
  T extends AppRouteMutation,
  TRequest extends ServerInferRequest<T> = ServerInferRequest<T>
> = (
  input: Omit<TRequest, 'headers'> & {
    headers: TRequest['headers'] & Express['request']['headers'];
    files: unknown;
    file: unknown;
    req: TsRestRequest<T>;
    res: Response;
  }
) => Promise<ServerInferResponses<T>>;

export type AppRouteImplementation<T extends AppRoute> =
  T extends AppRouteMutation
    ? AppRouteMutationImplementation<T>
    : T extends AppRouteQuery
    ? AppRouteQueryImplementation<T>
    : never;

export type TsRestRequest<T extends AppRouter | AppRoute> =
  Express['request'] & {
    tsRestRoute: FlattenAppRouter<T>;
  };

export type TsRestRequestHandler<T extends AppRouter | AppRoute> = (
  req: TsRestRequest<T>,
  res: Response,
  next: NextFunction
) => void;

export interface AppRouteOptions<TRoute extends AppRoute> {
  middleware?: TsRestRequestHandler<TRoute>[];
  handler: TRoute extends AppRouteQuery
    ? AppRouteQueryImplementation<TRoute>
    : TRoute extends AppRouteMutation
    ? AppRouteMutationImplementation<TRoute>
    : never;
}

export type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

export const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>
): obj is AppRouteImplementation<TRoute> => {
  return typeof obj === 'function';
};

export type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey]>
    : never;
};

export type TsRestExpressOptions<T extends AppRouter> = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
  globalMiddleware?: TsRestRequestHandler<FlattenAppRouter<T>>[];
  requestValidationErrorHandler?:
    | 'default'
    | 'combined'
    | ((
        err: RequestValidationError,
        req: TsRestRequest<FlattenAppRouter<T>>,
        res: Response,
        next: NextFunction
      ) => void);
};

type FlattenAppRouter<T extends AppRouter | AppRoute> = T extends AppRoute
  ? T
  : {
      [TKey in keyof T]: T[TKey] extends AppRoute
        ? T[TKey]
        : T[TKey] extends AppRouter
        ? FlattenAppRouter<T[TKey]>
        : never;
    }[keyof T];
