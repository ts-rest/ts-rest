import { Express, RequestHandler } from 'express';
import { z } from 'zod';
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  isAppRoute,
} from './dsl';
import { getAppRoutePathRoute } from './server';
import { getValue, Without } from './type-utils';

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: Parameters<T['path']>[0] extends undefined
        ? never
        : Parameters<T['path']>[0];
      query: T['query'] extends z.AnyZodObject ? z.infer<T['query']> : null;
    },
    never
  >
) => Promise<T['response']>;

type AppRouteMutationImplementation<T extends AppRouteMutation> = (
  input: Without<
    {
      params: Parameters<T['path']>[0];
      query: T['query'] extends z.AnyZodObject ? z.infer<T['query']> : never;
      body: T['body'] extends z.AnyZodObject ? z.infer<T['body']> : never;
    },
    never
  >
) => Promise<T['response']>;

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

export const initServer = () => {
  return {
    router: <T extends AppRouter>(router: T, args: RecursiveRouterObj<T>) =>
      args,
  };
};

const recursivelyApplyExpressRouter = (
  router: RecursiveRouterObj<any> | AppRouteImplementation<any>,
  path: string[],
  routeTransformer: (route: AppRouteImplementation<any>, path: string[]) => void
): void => {
  if (typeof router === 'object') {
    for (const key in router) {
      recursivelyApplyExpressRouter(
        router[key],
        [...path, key],
        routeTransformer
      );
    }
  } else if (typeof router === 'function') {
    routeTransformer(router, path);
  }
};

const transformAppRouteQueryImplementation = (
  route: AppRouteQueryImplementation<any>,
  schema: AppRouteQuery,
  app: Express
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[ts-rest] Initialized ${schema.method} ${path}`);

  app.get(path, async (req, res) => {
    const zodQueryIssues = returnZodErrorsIfZodSchema(schema.query, req.query);

    if (zodQueryIssues.length > 0) {
      return res.status(400).json({
        errors: zodQueryIssues,
      });
    }

    return res.json(await route({ params: req.params, query: req.query }));
  });
};

const transformAppRouteMutationImplementation = (
  route: AppRouteMutationImplementation<any>,
  schema: AppRouteMutation,
  app: Express
) => {
  const path = getAppRoutePathRoute(schema);

  console.log(`[ts-rest] Initialized ${schema.method} ${path}`);

  const method = schema.method;

  const callback: RequestHandler = async (req, res) => {
    try {
      const zodBodyIssues = returnZodErrorsIfZodSchema(schema.body, req.body);

      if (zodBodyIssues.length > 0) {
        return res.status(400).json({
          errors: zodBodyIssues,
        });
      }

      const zodQueryIssues = returnZodErrorsIfZodSchema(
        schema.query,
        req.query
      );

      if (zodQueryIssues.length > 0) {
        return res.status(400).json({
          errors: zodQueryIssues,
        });
      }

      const result = await route({
        params: req.params,
        body: req.body,
        query: req.query,
      });
      return res.json(result);
    } catch (e) {
      console.error(`[ts-rest] Error on ${method} ${path}`, e);
      return res.status(500).send('Internal Server Error');
    }
  };

  switch (method) {
    case 'DELETE':
      app.delete(path, callback);
      break;
    case 'POST':
      app.post(path, callback);
      break;
    case 'PUT':
      app.put(path, callback);
      break;
    case 'PATCH':
      app.patch(path, callback);
      break;
    default:
      // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = method;
  }
};

const returnZodErrorsIfZodSchema = (
  schema: unknown,
  body: unknown
): z.ZodIssue[] => {
  const bodySchema = schema as z.AnyZodObject;

  if (
    bodySchema &&
    bodySchema._def &&
    bodySchema._def.typeName === 'ZodObject'
  ) {
    // Check body schema
    const parsed = bodySchema.safeParse(body);

    if (parsed.success === false) {
      return parsed.error.issues;
    }
  }

  return [];
};

export const createExpressEndpoints = <
  T extends RecursiveRouterObj<TRouter>,
  TRouter extends AppRouter
>(
  schema: AppRouter,
  router: T,
  app: Express
) => {
  recursivelyApplyExpressRouter(router, [], (route, path) => {
    const routerViaPath = getValue(schema, path.join('.'));

    if (isAppRoute(routerViaPath)) {
      if (routerViaPath.__type === 'AppRouteMutation') {
        transformAppRouteMutationImplementation(route, routerViaPath, app);
      } else {
        transformAppRouteQueryImplementation(
          route as AppRouteQueryImplementation<any>,
          routerViaPath,
          app
        );
      }
    } else {
      throw new Error(
        'Could not find schema route implementation for ' + path.join('.')
      );
    }
  });
};
