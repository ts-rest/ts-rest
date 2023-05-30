import {
  ApiRouteServerResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  GetFieldType,
  isAppRoute,
  LowercaseKeys,
  PathParamsWithCustomValidators,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import * as fastify from 'fastify';

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> & Request['headers'];
      req: Request;
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
      req: Request;
    },
    never
  >
) => Promise<ApiRouteServerResponse<T['responses']>>;

type AppRouteImplementation<T extends AppRoute> = T extends AppRouteMutation
  ? AppRouteMutationImplementation<T>
  : T extends AppRouteQuery
  ? AppRouteQueryImplementation<T>
  : never;

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementation<T[TKey]>
    : never;
};

type RegisterRouterOptions = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
};

export const initServer = () => ({
  router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) => args,
  registerRouter: <
    T extends RecursiveRouterObj<TContract>,
    TContract extends AppRouter
  >(
    contract: TContract,
    routerImpl: T,
    app: fastify.FastifyInstance,
    options: RegisterRouterOptions = {
      logInitialization: true,
      jsonQuery: false,
      responseValidation: false,
    }
  ) => {
    recursivelyRegisterRouter(routerImpl, contract, [], app, options);
  },
});

/**
 *
 * @param routeImpl - User's implementation of the route
 * @param appRoute - the `ts-rest` contract for this route (e.g. with Path, params, query, body, etc.)
 * @param fastify - the fastify instance to register the route on
 */
const registerRoute = <TAppRoute extends AppRoute>(
  routeImpl: AppRouteImplementation<AppRoute>,
  appRoute: TAppRoute,
  fastify: fastify.FastifyInstance,
  options: RegisterRouterOptions
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${appRoute.method} ${appRoute.path}`);
  }

  switch (appRoute.method) {
    case 'GET':
      fastify.get(appRoute.path, async (request, reply) => {
        return {
          routeImpl,
          appRoute,
        };
      });
      break;
    case 'POST':
      fastify.post(appRoute.path, async (request, reply) => {
        return {
          foo: 'bar',
        };
      });
      break;
    case 'PUT':
      fastify.put(appRoute.path, async (request, reply) => {
        return {
          foo: 'bar',
        };
      });
      break;
    case 'DELETE':
      fastify.delete(appRoute.path, async (request, reply) => {
        return {
          foo: 'bar',
        };
      });
      break;
    case 'PATCH':
      fastify.patch(appRoute.path, async (request, reply) => {
        return {
          foo: 'bar',
        };
      });
      break;
  }
};

const recursivelyRegisterRouter = <T extends AppRouter>(
  routerImpl: RecursiveRouterObj<T>,
  appRouter: T,
  path: string[],
  fastify: fastify.FastifyInstance,
  options: RegisterRouterOptions
) => {
  if (typeof routerImpl === 'object') {
    for (const key in routerImpl) {
      recursivelyRegisterRouter(
        routerImpl[key] as unknown as RecursiveRouterObj<T>,
        appRouter,
        [...path, key],
        fastify,
        options
      );
    }
  } else if (typeof routerImpl === 'function') {
    const appRoute = getValue(appRouter, path.join('.')) as AppRoute;

    registerRoute(routerImpl, appRoute, fastify, options);
  }
};

export function getValue<
  TData,
  TPath extends string,
  TDefault = GetFieldType<TData, TPath>
>(
  data: TData,
  path: TPath,
  defaultValue?: TDefault
): GetFieldType<TData, TPath> | TDefault {
  const value = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .reduce<GetFieldType<TData, TPath>>(
      (value, key) => (value as any)?.[key],
      data as any
    );

  return value !== undefined ? value : (defaultValue as TDefault);
}
