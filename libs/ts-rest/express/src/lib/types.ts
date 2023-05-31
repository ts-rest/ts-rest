import {
  ApiRouteServerResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  LowercaseKeys,
  PathParamsWithCustomValidators,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import {
  Express,
  NextFunction,
  Request,
  Response,
} from 'express-serve-static-core';
import { RequestValidationError } from './request-validation-error';

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> & Request['headers'];
      req: TsRestRequest<T>;
      res: Response;
    },
    never
  >
) => Promise<ApiRouteServerResponse<T['responses']>>;

type WithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

type AppRouteMutationImplementation<T extends AppRouteMutation> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      body: WithoutFileIfMultiPart<T>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> & Request['headers'];
      files: unknown;
      file: unknown;
      req: TsRestRequest<T>;
      res: Response;
    },
    never
  >
) => Promise<ApiRouteServerResponse<T['responses']>>;

export type AppRouteImplementation<T extends AppRoute> =
  T extends AppRouteMutation
    ? AppRouteMutationImplementation<T>
    : T extends AppRouteQuery
    ? AppRouteQueryImplementation<T>
    : never;

export type TsRestRequest<TRoute extends AppRoute> = Express['request'] & {
  tsRestRoute: TRoute;
};

export type TsRestRequestPublic<T extends AppRouter | AppRoute> = TsRestRequest<
  T extends AppRoute ? T : T extends AppRouter ? FlattenAppRouter<T> : never
>;

export type TsRestRequestHandler<TRoute extends AppRoute> = (
  req: TsRestRequest<TRoute>,
  res: Response,
  next: NextFunction
) => void;

export type TsRestRequestHandlerPublic<T extends AppRouter | AppRoute> =
  TsRestRequestHandler<
    T extends AppRoute ? T : T extends AppRouter ? FlattenAppRouter<T> : never
  >;

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

type FlattenAppRouter<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? T[TKey]
    : T[TKey] extends AppRouter
    ? FlattenAppRouter<T[TKey]>
    : never;
}[keyof T];
