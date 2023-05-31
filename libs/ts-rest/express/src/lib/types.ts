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

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> & Request['headers'];
      req: TsRestRequest<T, any>;
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
      req: TsRestRequest<T, any>;
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

export type TsRestRequest<
  TRoute extends AppRoute,
  TContext
> = Express['request'] & {
  tsRest: { route: TRoute; context: TContext };
};

export interface TsRestRequestHandler<
  TRoute extends AppRoute,
  TContext = never
> {
  (
    req: TsRestRequest<TRoute, TContext>,
    res: Response,
    next: NextFunction
  ): void;
}

export interface AppRouteOptions<TRoute extends AppRoute, TContext = never> {
  middleware?: TsRestRequestHandler<TRoute, TContext>[];
  handler: TRoute extends AppRouteQuery
    ? AppRouteQueryImplementation<TRoute>
    : TRoute extends AppRouteMutation
    ? AppRouteMutationImplementation<TRoute>
    : never;
}

export type AppRouteImplementationOrOptions<
  TRoute extends AppRoute,
  TContext = never
> = AppRouteOptions<TRoute, TContext> | AppRouteImplementation<TRoute>;

export const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>
): obj is AppRouteImplementation<TRoute> => {
  return typeof obj === 'function';
};

export type RecursiveRouterObj<T extends AppRouter, TContext = never> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey], TContext>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey], TContext>
    : never;
};

export const RouterOptions = Symbol('RouterOptions');

export type CompleteRouterObj<
  T extends AppRouter,
  TContext = never
> = RecursiveRouterObj<T, TContext> & {
  [RouterOptions]?: {
    contextFunction: ContextFunction<T, TContext>;
  };
};

export type TsRestExpressOptions<TContext = any> = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
  globalMiddleware?: TsRestRequestHandler<AppRoute, TContext>[];
};

type FlattenAppRouter<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRoute
    ? T[TKey]
    : T[TKey] extends AppRouter
    ? FlattenAppRouter<T[TKey]>
    : never;
}[keyof T];

export type ContextFunction<T extends AppRouter, TContext> = ({
  req,
  route,
}: {
  req: Request;
  route: FlattenAppRouter<T>;
}) => TContext | Promise<TContext>;
