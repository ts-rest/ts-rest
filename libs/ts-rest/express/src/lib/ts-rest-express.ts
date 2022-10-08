import { IRouter, Request, Response } from 'express';
import { IncomingHttpHeaders } from 'http';
import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  isAppRoute,
  getValue,
  Without,
  ZodInferOrType,
  returnZodErrorsIfZodSchema,
  PathParams,
} from '@ts-rest/core';

export type ApiRouteResponse<T> = {
  [K in keyof T]: {
    status: K;
    body: ZodInferOrType<T[K]>;
  };
}[keyof T];

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: PathParams<T>;
      query: ZodInferOrType<T['query']>;
      headers: IncomingHttpHeaders;
      req: Request;
    },
    never
  >
) => Promise<ApiRouteResponse<T['responses']>>;

type WithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

type AppRouteMutationImplementation<T extends AppRouteMutation> = (
  input: Without<
    {
      params: PathParams<T>;
      query: ZodInferOrType<T['query']>;
      body: WithoutFileIfMultiPart<T>;
      headers: IncomingHttpHeaders;
      files: unknown;
      file: unknown;
      req: Request;
    },
    never
  >
) => Promise<ApiRouteResponse<T['responses']>>;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: RecursiveRouterObj<any> | AppRouteImplementation<any>,
  path: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: AppRouteQueryImplementation<any>,
  schema: AppRouteQuery,
  app: IRouter
) => {
  console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);

  app.get(schema.path, async (req, res) => {
    const zodQueryIssues = returnZodErrorsIfZodSchema(schema.query, req.query);

    if (zodQueryIssues.length > 0) {
      return res.status(400).json({
        errors: zodQueryIssues,
      });
    }

    const result = await route({    // @ts-ignore
      params: req.params,
      query: req.query,
      headers: req.headers,
      req: req,
    });

    return res.status(Number(result.status)).json(result.body);
  });
};

const transformAppRouteMutationImplementation = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: AppRouteMutationImplementation<any>,
  schema: AppRouteMutation,
  app: IRouter
) => {
  console.log(`[ts-rest] Initialized ${schema.method} ${schema.path}`);

  const method = schema.method;

  const callback = async (req: Request, res: Response) => {
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

        // @ts-ignore
        params: req.params,
        body: req.body,
        query: req.query,
        headers: req.headers,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        files: req.files,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        file: req.file,
        req: req,
      });

      return res.status(Number(result.status)).json(result.body);
    } catch (e) {
      console.error(`[ts-rest] Error on ${method} ${schema.path}`, e);
      return res.status(500).send('Internal Server Error');
    }
  };

  switch (method) {
    case 'DELETE':
      app.delete(schema.path, callback);
      break;
    case 'POST':
      app.post(schema.path, callback);
      break;
    case 'PUT':
      app.put(schema.path, callback);
      break;
    case 'PATCH':
      app.patch(schema.path, callback);
      break;
  }
};

export const createExpressEndpoints = <
  T extends RecursiveRouterObj<TRouter>,
  TRouter extends AppRouter
>(
  schema: TRouter,
  router: T,
  app: IRouter
) => {
  recursivelyApplyExpressRouter(router, [], (route, path) => {
    const routerViaPath = getValue(schema, path.join('.'));

    if (!routerViaPath) {
      throw new Error(`[ts-rest] No router found for path ${path.join('.')}`);
    }

    if (isAppRoute(routerViaPath)) {
      if (routerViaPath.method !== 'GET') {
        transformAppRouteMutationImplementation(route, routerViaPath, app);
      } else {
        transformAppRouteQueryImplementation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
