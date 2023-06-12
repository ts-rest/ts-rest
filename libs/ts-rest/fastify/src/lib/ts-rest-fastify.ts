import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  isAppRouteOtherResponse,
  parseJsonQueryObject,
  ServerInferRequest,
  ServerInferResponses,
  validateResponse,
} from '@ts-rest/core';
import * as fastify from 'fastify';
import { z } from 'zod';

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

type AppRouteImplementation<T extends AppRoute> = (
  input: ServerInferRequest<T, fastify.FastifyRequest['headers']> & {
    request: fastify.FastifyRequest;
    reply: fastify.FastifyReply;
  }
) => Promise<ServerInferResponses<T>> | ServerInferResponses<T>;

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey]>
    : never;
};

type InitialisedRouter<TContract extends AppRouter> = {
  contract: TContract;
  routes: RecursiveRouterObj<TContract>;
};

type RegisterRouterOptions = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
  hooks?: RouteHooks;
  requestValidationErrorHandler?:
    | 'combined'
    | ((
        err: RequestValidationError,
        request: fastify.FastifyRequest,
        reply: fastify.FastifyReply
      ) => void);
};

export type RouteHooks = Pick<
  fastify.RouteOptions,
  | 'preParsing'
  | 'preValidation'
  | 'preHandler'
  | 'preSerialization'
  | 'onRequest'
  | 'onSend'
  | 'onResponse'
  | 'onTimeout'
  | 'onError'
  | 'onRequestAbort'
>;

type AppRouteOptions<TRoute extends AppRoute> = {
  hooks?: RouteHooks;
  handler: AppRouteImplementation<TRoute>;
};

type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>
): obj is AppRouteImplementation<TRoute> => {
  return typeof obj === 'function';
};

const validateRequest = (
  request: fastify.FastifyRequest,
  reply: fastify.FastifyReply,
  schema: AppRouteQuery | AppRouteMutation,
  options: RegisterRouterOptions
) => {
  const paramsResult = checkZodSchema(request.params, schema.pathParams, {
    passThroughExtraKeys: true,
  });

  const headersResult = checkZodSchema(request.headers, schema.headers, {
    passThroughExtraKeys: true,
  });

  const queryResult = checkZodSchema(
    options.jsonQuery
      ? parseJsonQueryObject(request.query as Record<string, string>)
      : request.query,
    schema.query
  );

  const bodyResult = checkZodSchema(
    request.body,
    'body' in schema ? schema.body : null
  );

  if (
    !paramsResult.success ||
    !headersResult.success ||
    !queryResult.success ||
    !bodyResult.success
  ) {
    throw new RequestValidationError(
      paramsResult.success ? null : paramsResult.error,
      headersResult.success ? null : headersResult.error,
      queryResult.success ? null : queryResult.error,
      bodyResult.success ? null : bodyResult.error
    );
  }

  return {
    paramsResult,
    headersResult,
    queryResult,
    bodyResult,
  };
};

export const initServer = () => ({
  router: <TContract extends AppRouter>(
    contract: TContract,
    routes: RecursiveRouterObj<TContract>
  ): InitialisedRouter<TContract> => ({
    contract,
    routes,
  }),
  registerRouter: <
    T extends InitialisedRouter<TContract>,
    TContract extends AppRouter
  >(
    contract: TContract,
    routerImpl: T,
    app: fastify.FastifyInstance,
    options: RegisterRouterOptions = {
      logInitialization: true,
      jsonQuery: false,
      responseValidation: false,
      requestValidationErrorHandler: 'combined',
    }
  ) => {
    const { hooks = {}, ...restOfOptions } = options;
    recursivelyRegisterRouter(
      routerImpl.routes,
      contract,
      [],
      app,
      restOfOptions
    );

    Object.keys(hooks).forEach((hookName) =>
      // @ts-expect-error Fastify's hook overload seems to be complaining here for no reason afaik
      app.addHook(hookName, hooks[hookName])
    );

    app.setErrorHandler(
      requestValidationErrorHandler(options.requestValidationErrorHandler)
    );
  },
  plugin:
    <T extends AppRouter>(
      router: InitialisedRouter<T>
    ): fastify.FastifyPluginCallback<RegisterRouterOptions> =>
    (
      app,
      opts = {
        logInitialization: true,
        jsonQuery: false,
        responseValidation: false,
        requestValidationErrorHandler: 'combined',
      },
      done
    ) => {
      const { hooks = {}, ...restOfOptions } = opts;
      recursivelyRegisterRouter(
        router.routes,
        router.contract,
        [],
        app,
        restOfOptions
      );

      Object.keys(hooks).forEach((hookName) =>
        // @ts-expect-error Fastify's hook overload seems to be complaining here for no reason afaik
        app.addHook(hookName, hooks[hookName])
      );

      app.setErrorHandler(
        requestValidationErrorHandler(opts.requestValidationErrorHandler)
      );

      done();
    },
});

const requestValidationErrorHandler = (
  handler: RegisterRouterOptions['requestValidationErrorHandler'] = 'combined'
) => {
  return (
    err: unknown,
    request: fastify.FastifyRequest,
    reply: fastify.FastifyReply
  ) => {
    if (err instanceof RequestValidationError) {
      if (handler === 'combined') {
        return reply.status(400).send({
          pathParameterErrors: err.pathParams,
          headerErrors: err.headers,
          queryParameterErrors: err.query,
          bodyErrors: err.body,
        });
      } else {
        return handler(err, request, reply);
      }
    }
  };
};

/**
 *
 * @param routeImpl - User's implementation of the route
 * @param appRoute - the `ts-rest` contract for this route (e.g. with Path, params, query, body, etc.)
 * @param fastify - the fastify instance to register the route on
 * @param options - options for the routers
 */
const registerRoute = <TAppRoute extends AppRoute>(
  routeImpl: AppRouteImplementationOrOptions<AppRoute>,
  appRoute: TAppRoute,
  app: fastify.FastifyInstance,
  options: RegisterRouterOptions
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${appRoute.method} ${appRoute.path}`);
  }

  const handler = isAppRouteImplementation(routeImpl)
    ? routeImpl
    : routeImpl.handler;

  const hooks = isAppRouteImplementation(routeImpl)
    ? {}
    : routeImpl.hooks || {};

  const route: fastify.RouteOptions = {
    ...hooks,
    method: appRoute.method,
    url: appRoute.path,
    handler: async (request, reply) => {
      const validationResults = validateRequest(
        request,
        reply,
        appRoute,
        options
      );

      const result = await handler({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: validationResults.paramsResult.data as any,
        query: validationResults.queryResult.data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        headers: validationResults.headersResult.data as any,
        request,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: request.body as any,
        reply,
      });

      const statusCode = result.status;
      const responseType = appRoute.responses[statusCode];

      let validatedResponseBody = result.body;

      if (options.responseValidation) {
        const response = validateResponse({
          responseType,
          response: {
            status: statusCode,
            body: result.body,
          },
        });

        validatedResponseBody = response.body;
      }

      if (isAppRouteOtherResponse(responseType)) {
        reply.header('content-type', responseType.contentType);
      }

      return reply.status(statusCode).send(validatedResponseBody);
    },
  };

  app.route(route);
};

/**
 *
 * @param routerImpl - the user's implementation of the router
 * @param appRouter - the `ts-rest` contract for this router
 * @param path - the path to the current router, e.g. ["posts", "getPosts"]
 * @param fastify  - the fastify instance to register the route on
 * @param options
 */
const recursivelyRegisterRouter = <T extends AppRouter>(
  routerImpl: RecursiveRouterObj<T>,
  appRouter: T,
  path: string[],
  fastify: fastify.FastifyInstance,
  options: RegisterRouterOptions
) => {
  if (
    typeof routerImpl === 'object' &&
    typeof routerImpl?.['handler'] !== 'function'
  ) {
    for (const key in routerImpl) {
      recursivelyRegisterRouter(
        routerImpl[key] as unknown as RecursiveRouterObj<T>,
        appRouter[key] as unknown as T,
        [...path, key],
        fastify,
        options
      );
    }
  } else if (
    typeof routerImpl === 'function' ||
    typeof routerImpl?.['handler'] === 'function'
  ) {
    registerRoute(
      routerImpl as unknown as AppRouteImplementationOrOptions<AppRoute>,
      appRouter as unknown as AppRoute,
      fastify,
      options
    );
  }
};
