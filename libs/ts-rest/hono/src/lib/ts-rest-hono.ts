/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApiRouteServerResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  GetFieldType,
  isAppRoute,
  isZodObject,
  parseJsonQueryObject,
  PathParamsWithCustomValidators,
  validateResponse,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import type { Context, Env as HonoEnv, Hono, Next } from 'hono';
import { StatusCode } from 'hono/utils/http-status';
import type { IncomingHttpHeaders } from 'http';
import { z } from 'zod';

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

type AppRouteQueryImplementation<
  T extends AppRouteQuery,
  Env extends HonoEnv
> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      headers: IncomingHttpHeaders;
      req: Request;
    },
    never
  >,
  context: Context<Env, any>
) => Promise<ApiRouteServerResponse<T['responses']>> | Response;

type WithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

type AppRouteMutationImplementation<
  T extends AppRouteMutation,
  Env extends HonoEnv
> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      body: WithoutFileIfMultiPart<T>;
      headers: IncomingHttpHeaders;
      files: unknown;
      file: unknown;
      req: Request;
    },
    never
  >,
  context: Context<Env, any>
) => Promise<ApiRouteServerResponse<T['responses']>> | Response;

type AppRouteImplementation<
  T extends AppRoute,
  Env extends HonoEnv
> = T extends AppRouteMutation
  ? AppRouteMutationImplementation<T, Env>
  : T extends AppRouteQuery
  ? AppRouteQueryImplementation<T, Env>
  : never;

export type RecursiveRouterObj<T extends AppRouter, Env extends HonoEnv> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey], Env>
    : T[TKey] extends AppRoute
    ? AppRouteImplementation<T[TKey], Env>
    : never;
};

export type Options<E extends HonoEnv = HonoEnv> = {
  logInitialization?: boolean;
  jsonQuery?: boolean | ((c: Context<E, any>) => boolean);
  responseValidation?: boolean | ((c: Context<E, any>) => boolean);
  errorHandler?: (error: unknown, context?: Context<E, any>) => void;
};
type ResolvableOption = Options<HonoEnv>[keyof Pick<
  Options,
  'responseValidation' | 'jsonQuery'
>];

export const initServer = <Env extends HonoEnv>() => {
  return {
    router: <T extends AppRouter>(
      router: T,
      args: RecursiveRouterObj<T, Env>
    ) => args,
  };
};

const recursivelyApplyHonoRouter = (
  router: RecursiveRouterObj<any, any> | AppRouteImplementation<any, any>,
  path: string[],
  routeTransformer: (
    route: AppRouteImplementation<any, any>,
    path: string[]
  ) => void
): void => {
  if (typeof router === 'object') {
    for (const key in router) {
      recursivelyApplyHonoRouter(router[key], [...path, key], routeTransformer);
    }
  } else if (typeof router === 'function') {
    routeTransformer(router, path);
  }
};

function resolveOption(option: ResolvableOption, c: Context<any> = {} as any) {
  return typeof option === 'function' ? option(c) : option;
}

/**
 * This function leverages a Zod schema to determine if we should call the
 * c.queries method for a given key so that we can support arrays.
 *
 * @param schema the ts-rest schema
 * @param query a record of query parameters as parsed by hono c.query
 * @param c hono context
 * @returns object
 */
function maybeTransformQueryFromSchema(
  schema: AppRouteQuery | AppRouteMutation,
  query: Record<string, any>,
  c: Context<any>
) {
  const result = Object.assign({}, query);

  if (isZodObject(schema.query)) {
    Object.entries(schema.query.shape).forEach(([key, zodSchema]) => {
      if (
        zodSchema instanceof z.ZodArray ||
        (zodSchema instanceof z.ZodOptional &&
          zodSchema._def.innerType instanceof z.ZodArray)
      ) {
        // We need to call .queries() for known array keys, otherwise they come back as one string even if there are multiple entries
        result[key] = c.req.queries(key);
      }
    });
  }

  return result;
}

const transformAppRouteQueryImplementation = (
  route: AppRouteQueryImplementation<any, any>,
  schema: AppRouteQuery,
  app: Hono<any>,
  options: Options
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);
  }

  app.get(schema.path, async (c: Context<any>, next: Next) => {
    const isJsonQueryEnabled = resolveOption(options.jsonQuery, c);
    const query = isJsonQueryEnabled
      ? parseJsonQueryObject(c.req.query() as any as Record<string, string>)
      : c.req.query();

    const finalQuery = maybeTransformQueryFromSchema(schema, query, c);

    const queryResult = checkZodSchema(finalQuery, schema.query);

    if (!queryResult.success) {
      return c.json(queryResult.error, 400);
    }

    const paramsResult = checkZodSchema(c.req.param(), schema.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!paramsResult.success) {
      return c.json(paramsResult.error, 400);
    }

    try {
      const result = await route(
        {
          params: paramsResult.data,
          query: queryResult.data,
          headers: c.req.header(),
          req: c.req.raw,
        },
        c
      );

      // If someone just calls `return c.(json|jsonT|text)` or returns a `Response` directly, just skip everything else we'd do here as they're taking ownership of the response
      if (result instanceof Response) {
        return result;
      }

      const statusCode = Number(result.status) as StatusCode;

      if (resolveOption(options.responseValidation, c)) {
        try {
          const response = validateResponse({
            responseType: schema.responses[statusCode],
            response: {
              status: statusCode,
              body: result.body,
            },
          });

          return c.json(response.body, statusCode);
        } catch (err) {
          return c.json(err, 400);
        }
      }

      return c.json(result.body, statusCode);
    } catch (e) {
      console.log(
        `[ts-rest] error processing handler for: ${route.name}, path: ${schema.path}`
      );
      console.error(e);

      options.errorHandler?.(e, c);

      return next();
    }
  });
};

const transformAppRouteMutationImplementation = (
  route: AppRouteMutationImplementation<any, any>,
  schema: AppRouteMutation,
  app: Hono<any>,
  options: Options
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);
  }

  const method = schema.method;

  const reqHandler = async (c: Context, next: Next) => {
    const query = resolveOption(options.jsonQuery, c)
      ? parseJsonQueryObject(c.req.query())
      : c.req.query();

    const finalQuery = maybeTransformQueryFromSchema(schema, query, c);

    const queryResult = checkZodSchema(finalQuery, schema.query);

    if (!queryResult.success) {
      return c.json(queryResult.error, 400);
    }

    const bodyResult = checkZodSchema(await c.req.json(), schema.body);

    if (!bodyResult.success) {
      return c.json(bodyResult.error, 400);
    }

    const paramsResult = checkZodSchema(c.req.param(), schema.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!paramsResult.success) {
      return c.json(paramsResult.error, 400);
    }

    try {
      const result = await route(
        {
          params: paramsResult.data,
          body: bodyResult.data,
          query: queryResult.data,
          headers: c.req.header(),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          files: c.req.files, // TODO: map this?
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          file: c.req.file, // TODO: map this?
          req: c.req.raw,
        },
        c
      );

      // If someone just calls `return c.(json|jsonT|text)` or returns a `Response` directly, just skip everything else we'd do here as they're taking ownership of the response
      if (result instanceof Response) {
        return result;
      }

      const statusCode = Number(result.status) as StatusCode;

      if (resolveOption(options.responseValidation)) {
        try {
          const response = validateResponse({
            responseType: schema.responses[statusCode],
            response: {
              status: statusCode,
              body: result.body,
            },
          });

          return c.json(response.body, statusCode);
        } catch (err) {
          return c.json(err, 400);
        }
      }

      return c.json(result.body, statusCode);
    } catch (e) {
      console.log(
        `[ts-rest] error processing handler for: ${route.name}, path: ${schema.path}`
      );
      console.error(e);

      options.errorHandler?.(e, c);

      return next();
    }
  };

  switch (method) {
    case 'DELETE':
      app.delete(schema.path, reqHandler);
      break;
    case 'POST':
      app.post(schema.path, reqHandler);
      break;
    case 'PUT':
      app.put(schema.path, reqHandler);
      break;
    case 'PATCH':
      app.patch(schema.path, reqHandler);
      break;
  }
};

type ExtractEnv<T> = T extends Hono<infer Env, any> ? Env : never;

export type CreateHonoEndpointsOptions<HonoApp> = Options<ExtractEnv<HonoApp>>;

export const createHonoEndpoints = <
  T extends RecursiveRouterObj<TRouter, any>,
  TRouter extends AppRouter,
  H extends Hono<any, any>
>(
  schema: TRouter,
  router: T,
  app: H,
  options: CreateHonoEndpointsOptions<H> = {
    logInitialization: true,
    jsonQuery: false,
    responseValidation: false,
    errorHandler: undefined,
  }
) => {
  recursivelyApplyHonoRouter(router, [], (route, path) => {
    const routerViaPath = getValue(schema, path.join('.'));

    if (!routerViaPath) {
      throw new Error(`[ts-rest] No router found for path ${path.join('.')}`);
    }

    if (isAppRoute(routerViaPath)) {
      if (routerViaPath.method === 'GET') {
        transformAppRouteQueryImplementation(
          route as AppRouteQueryImplementation<any, ExtractEnv<H>>,
          routerViaPath,
          app,
          options as any
        );
      } else {
        transformAppRouteMutationImplementation(
          route,
          routerViaPath,
          app,
          options as any
        );
      }
    } else {
      throw new Error(
        'Could not find schema route implementation for ' + path.join('.')
      );
    }
  });
};
