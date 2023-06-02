import {
  ApiRouteServerResponse,
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  LowercaseKeys,
  parseJsonQueryObject,
  PathParamsWithCustomValidators,
  validateResponse,
  Without,
  ZodInferOrType,
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

type AppRouteQueryImplementation<T extends AppRouteQuery> = (
  input: Without<
    {
      params: PathParamsWithCustomValidators<T>;
      query: ZodInferOrType<T['query']>;
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> &
        fastify.FastifyRequest['headers'];
      request: fastify.FastifyRequest;
      reply: fastify.FastifyReply;
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
      headers: LowercaseKeys<ZodInferOrType<T['headers']>> &
        fastify.FastifyRequest['headers'];
      request: fastify.FastifyRequest;
      reply: fastify.FastifyReply;
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
  requestValidationErrorHandler?:
    | 'combined'
    | ((
        err: RequestValidationError,
        request: fastify.FastifyRequest,
        reply: fastify.FastifyReply
      ) => void);
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
      requestValidationErrorHandler: 'combined',
    }
  ) => {
    recursivelyRegisterRouter(routerImpl, contract, [], app, options);

    app.setErrorHandler(
      requestValidationErrorHandler(options.requestValidationErrorHandler)
    );
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

  fastify.route({
    method: appRoute.method,
    url: appRoute.path,
    handler: async (request, reply) => {
      const validationResults = validateRequest(
        request,
        reply,
        appRoute,
        options
      );

      const result = await routeImpl({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: validationResults.paramsResult.data as any,
        query: validationResults.queryResult.data,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        headers: validationResults.headersResult.data as any,
        request,
        body: request.body,
        reply,
      });

      const statusCode = result.status;

      if (options.responseValidation) {
        const response = validateResponse({
          responseType: appRoute.responses[statusCode],
          response: {
            status: statusCode,
            body: result.body,
          },
        });

        return reply.status(statusCode).send(response.body);
      }

      return reply.status(statusCode).send(result.body);
    },
  });
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
  if (typeof routerImpl === 'object') {
    for (const key in routerImpl) {
      recursivelyRegisterRouter(
        routerImpl[key] as unknown as RecursiveRouterObj<T>,
        appRouter[key] as unknown as T,
        [...path, key],
        fastify,
        options
      );
    }
  } else if (typeof routerImpl === 'function') {
    registerRoute(
      routerImpl,
      appRouter as unknown as AppRoute,
      fastify,
      options
    );
  }
};
