import {
  AppRoute,
  AppRouteDeleteNoBody,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  FlattenAppRouter,
  ServerInferRequest,
  ServerInferResponseBody,
  ServerInferResponses,
} from '@ts-rest/core';
import {
  Express,
  NextFunction,
  Response,
  Request,
} from 'express-serve-static-core';
import { RequestValidationError } from './request-validation-error';

export type AppRouteQueryImplementation<
  T extends AppRouteQuery | AppRouteDeleteNoBody,
> = (
  input: ServerInferRequest<T, Express['request']['headers']> & {
    req: TsRestRequest<T>;
    res: Response;
  },
) => Promise<ServerInferResponses<T>>;

export type AppRouteMutationImplementation<T extends AppRouteMutation> = (
  input: ServerInferRequest<T, Express['request']['headers']> & {
    files: unknown;
    file: unknown;
    req: TsRestRequest<T>;
    res: Response;
  },
) => Promise<ServerInferResponses<T>>;

export type AppRouteImplementation<T extends AppRoute> =
  T extends AppRouteMutation
    ? AppRouteMutationImplementation<T>
    : T extends AppRouteQuery | AppRouteDeleteNoBody
    ? AppRouteQueryImplementation<T>
    : never;

export type TsRestRequest<
  T extends AppRouter | AppRoute,
  F extends FlattenAppRouter<T> = FlattenAppRouter<T>,
  S extends ServerInferRequest<F> = ServerInferRequest<F>,
> = Request<
  'params' extends keyof S ? S['params'] : Express['request']['params'],
  ServerInferResponseBody<F>,
  'body' extends keyof S ? S['body'] : Express['request']['body'],
  'query' extends keyof S ? S['query'] : Express['request']['query']
> & {
  tsRestRoute: F;
  headers: 'headers' extends keyof S
    ? S['headers']
    : Express['request']['headers'];
};

export type TsRestRequestHandler<T extends AppRouter | AppRoute> = (
  req: TsRestRequest<T>,
  res: Response,
  next: NextFunction,
) => void;

export interface AppRouteOptions<TRoute extends AppRoute> {
  middleware?: TsRestRequestHandler<TRoute>[];
  handler: TRoute extends AppRouteQuery | AppRouteDeleteNoBody
    ? AppRouteQueryImplementation<TRoute>
    : TRoute extends AppRouteMutation
    ? AppRouteMutationImplementation<TRoute>
    : never;
}

export type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

export const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>,
): obj is AppRouteImplementation<TRoute> => {
  return typeof obj === 'function';
};

export type RouterImplementation<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RouterImplementation<T[TKey]>
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
        next: NextFunction,
      ) => void);
};
