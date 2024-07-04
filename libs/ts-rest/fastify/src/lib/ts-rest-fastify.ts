import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  HTTPStatusCode,
  isAppRouteNoBody,
  isAppRouteOtherResponse,
  parseJsonQueryObject,
  ServerInferRequest,
  ServerInferResponses,
  TsRestResponseError,
  validateResponse,
} from '@ts-rest/core';
import * as fastify from 'fastify';
import { z } from 'zod';

export class RequestValidationError extends Error {
  constructor(
    public pathParams: z.ZodError | null,
    public headers: z.ZodError | null,
    public query: z.ZodError | null,
    public body: z.ZodError | null,
  ) {
    super('[ts-rest] request validation failed');
  }
}

type AppRouteImplementation<T extends AppRoute> = (
  input: ServerInferRequest<T, fastify.FastifyRequest['headers']> & {
    request: fastify.FastifyRequest;
    reply: fastify.FastifyReply;
    appRoute: T;
  },
) => Promise<ServerInferResponses<T>>;

interface AppRouteOptions<TRoute extends AppRoute> {
  onRequest?: fastify.onRequestHookHandler | fastify.onRequestAsyncHookHandler;
  preParsing?:
    | fastify.preParsingHookHandler
    | fastify.preParsingAsyncHookHandler;
  preValidation?:
    | fastify.preValidationHookHandler
    | fastify.preValidationAsyncHookHandler;
  preHandler?:
    | fastify.preHandlerHookHandler
    | fastify.preHandlerAsyncHookHandler;
  preSerialization?:
    | fastify.preSerializationHookHandler<unknown>
    | fastify.preSerializationAsyncHookHandler<unknown>;
  onSend?:
    | fastify.onSendHookHandler<unknown>
    | fastify.onSendAsyncHookHandler<unknown>;
  onResponse?:
    | fastify.onResponseHookHandler
    | fastify.onResponseAsyncHookHandler;
  onTimeout?: fastify.onTimeoutHookHandler | fastify.onTimeoutAsyncHookHandler;
  onError?: fastify.onErrorHookHandler | fastify.onErrorAsyncHookHandler;
  onRequestAbort?:
    | fastify.onRequestAbortHookHandler
    | fastify.onRequestAbortAsyncHookHandler;
  handler: AppRouteImplementation<TRoute>;
}

type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | AppRouteImplementation<TRoute>;

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? InitialisedRouter<T[TKey]> | RecursiveRouterObj<T[TKey]>
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
  requestValidationErrorHandler?:
    | 'combined'
    | ((
        err: RequestValidationError,
        request: fastify.FastifyRequest,
        reply: fastify.FastifyReply,
      ) => void);
};

const validateRequest = (
  request: fastify.FastifyRequest,
  reply: fastify.FastifyReply,
  schema: AppRouteQuery | AppRouteMutation,
  options: RegisterRouterOptions,
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
    schema.query,
  );

  const bodyResult = checkZodSchema(
    request.body,
    'body' in schema ? schema.body : null,
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
      bodyResult.success ? null : bodyResult.error,
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
    routes: RecursiveRouterObj<TContract>,
  ): InitialisedRouter<TContract> => ({
    contract,
    routes,
  }),
  route: <TAppRoute extends AppRoute>(
    route: TAppRoute,
    implementation: AppRouteImplementation<TAppRoute>,
  ) => implementation,
  registerRouter: <
    T extends InitialisedRouter<TContract>,
    TContract extends AppRouter,
  >(
    contract: TContract,
    routerImpl: T,
    app: fastify.FastifyInstance,
    options: RegisterRouterOptions = {
      logInitialization: true,
      jsonQuery: false,
      responseValidation: false,
      requestValidationErrorHandler: 'combined',
    },
  ) => {
    recursivelyRegisterRouter(routerImpl.routes, contract, [], app, options);

    app.setErrorHandler(
      requestValidationErrorHandler(options.requestValidationErrorHandler),
    );
  },
  plugin:
    <T extends AppRouter>(
      router: InitialisedRouter<T>,
    ): fastify.FastifyPluginCallback<RegisterRouterOptions> =>
    (
      app,
      opts = {
        logInitialization: true,
        jsonQuery: false,
        responseValidation: false,
        requestValidationErrorHandler: 'combined',
      },
      done,
    ) => {
      recursivelyRegisterRouter(router.routes, router.contract, [], app, opts);

      app.setErrorHandler(
        requestValidationErrorHandler(opts.requestValidationErrorHandler),
      );

      done();
    },
});

const requestValidationErrorHandler = (
  handler: RegisterRouterOptions['requestValidationErrorHandler'] = 'combined',
) => {
  return (
    err: unknown,
    request: fastify.FastifyRequest,
    reply: fastify.FastifyReply,
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
    } else {
      return reply.send(err);
    }
  };
};

/**
 * @param routeImpl - User's implementation of the route
 * @param appRoute - the `ts-rest` contract for this route (e.g. with Path, params, query, body, etc.)
 * @param fastify - the fastify instance to register the route on
 * @param options - options for the routers
 */
const registerRoute = <TAppRoute extends AppRoute>(
  routeImpl: AppRouteOptions<AppRoute>,
  appRoute: TAppRoute,
  fastify: fastify.FastifyInstance,
  options: RegisterRouterOptions,
) => {
  if (options.logInitialization) {
    console.log(`[ts-rest] Initialized ${appRoute.method} ${appRoute.path}`);
  }

  fastify.route({
    config: {
      appRoute,
    },
    method: appRoute.method,
    url: appRoute.path,
    onRequest: routeImpl.onRequest,
    onResponse: routeImpl.onResponse,
    preParsing: routeImpl.preParsing,
    preValidation: routeImpl.preValidation,
    preHandler: routeImpl.preHandler,
    preSerialization: routeImpl.preSerialization,
    onSend: routeImpl.onSend,
    onTimeout: routeImpl.onTimeout,
    onError: routeImpl.onError,
    onRequestAbort: routeImpl.onRequestAbort,
    handler: async (request, reply) => {
      const validationResults = validateRequest(
        request,
        reply,
        appRoute,
        options,
      );

      let result: { status: HTTPStatusCode; body: unknown };
      try {
        result = await routeImpl.handler({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params: validationResults.paramsResult.data as any,
          query: validationResults.queryResult.data,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          headers: validationResults.headersResult.data as any,
          request,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          body: validationResults.bodyResult.data as any,
          reply,
          appRoute,
        });
      } catch (e) {
        if (e instanceof TsRestResponseError) {
          result = {
            status: e.statusCode,
            body: e.body,
          };
        } else {
          throw e;
        }
      }

      const statusCode = result.status;

      let validatedResponseBody = result.body;

      if (options.responseValidation) {
        const response = validateResponse({
          appRoute,
          response: {
            status: statusCode,
            body: result.body,
          },
        });

        validatedResponseBody = response.body;
      }

      const responseType = appRoute.responses[statusCode];

      if (isAppRouteNoBody(responseType)) {
        return reply.status(statusCode).send();
      }

      if (isAppRouteOtherResponse(responseType)) {
        reply.header('content-type', responseType.contentType);
      }

      return reply.status(statusCode).send(validatedResponseBody);
    },
  });
};

const implementationIsInitialisedRouter = <T extends AppRouter>(
  implementation: InitialisedRouter<T> | RecursiveRouterObj<T>,
): implementation is InitialisedRouter<T> => {
  return 'contract' in implementation && 'routes' in implementation;
};

const implementationIsRouteWithHandler = <T extends AppRouter>(
  implementation: RecursiveRouterObj<T>,
): boolean => {
  return 'handler' in implementation;
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
  options: RegisterRouterOptions,
) => {
  if (typeof routerImpl === 'object') {
    if (implementationIsInitialisedRouter(routerImpl)) {
      recursivelyRegisterRouter(
        routerImpl.routes,
        appRouter,
        [...path],
        fastify,
        options,
      );
    } else if (implementationIsRouteWithHandler(routerImpl)) {
      registerRoute(
        routerImpl as unknown as AppRouteOptions<AppRoute>,
        appRouter as unknown as AppRoute,
        fastify,
        options,
      );
    } else {
      for (const key in routerImpl) {
        recursivelyRegisterRouter(
          routerImpl[key] as unknown as RecursiveRouterObj<T>,
          appRouter[key] as unknown as T,
          [...path, key],
          fastify,
          options,
        );
      }
    }
  } else if (typeof routerImpl === 'function') {
    registerRoute(
      { handler: routerImpl },
      appRouter as unknown as AppRoute,
      fastify,
      options,
    );
  }
};
