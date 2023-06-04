import {
  AppRoute,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  checkZodSchema,
  isAppRoute,
  parseJsonQueryObject,
  ServerInferRequest,
  ServerInferResponses,
  validateResponse,
} from '@ts-rest/core';
import { ApiGatewayEvent, requestFromEvent } from './providers/aws/api-gateway';
import { Router, withContent, withParams } from 'itty-router';
import { TsRestRequest } from './request';
import { Context } from 'aws-lambda';
import { Request, Response } from 'express-serve-static-core';
import { RequestValidationError } from '@ts-rest/express';

type AppRouteImplementation<T extends AppRoute> = (
  args: ServerInferRequest<T, Headers> & {
    requestContext: ApiGatewayEvent['requestContext'];
    lambdaContext: Context;
  }
) => Promise<ServerInferResponses<T>>;

type RecursiveRouterObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveRouterObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementation<T[TKey]>
    : never;
};

const recursivelyProcessContract = ({
  schema,
  router,
  processRoute,
}: {
  schema: AppRouter | AppRoute;
  router: RecursiveRouterObj<any> | AppRouteImplementation<any>;
  processRoute: (
    implementation: AppRouteImplementation<AppRoute>,
    schema: AppRoute
  ) => void;
}): void => {
  if (typeof router === 'object') {
    for (const key in router) {
      if (isAppRoute(schema)) {
        throw new Error(`[ts-rest] Expected AppRouter but received AppRoute`);
      }

      recursivelyProcessContract({
        schema: schema[key],
        router: (router as RecursiveRouterObj<any>)[key],
        processRoute,
      });
    }
  } else if (typeof router === 'function') {
    if (!isAppRoute(schema)) {
      throw new Error(`[ts-rest] Expected AppRoute but received AppRouter`);
    }

    processRoute(router as AppRouteImplementation<AppRoute>, schema);
  }
};

const validateRequest = (
  req: TsRestRequest,
  schema: AppRouteQuery | AppRouteMutation
) => {
  const paramsResult = checkZodSchema(req.params, schema.pathParams, {
    passThroughExtraKeys: true,
  });

  const headersResult = checkZodSchema(req.headers, schema.headers, {
    passThroughExtraKeys: true,
  });

  const query = req.query;

  const queryResult = checkZodSchema(query, schema.query);

  const bodyResult = checkZodSchema(
    req.body,
    'body' in schema ? schema.body : null
  );

  if (
    !paramsResult.success ||
    !headersResult.success ||
    !queryResult.success ||
    !bodyResult.success
  ) {
    throw new RequestValidationError(
      !paramsResult.success ? paramsResult.error : null,
      !headersResult.success ? headersResult.error : null,
      !queryResult.success ? queryResult.error : null,
      !bodyResult.success ? bodyResult.error : null
    );
  }

  return {
    paramsResult,
    headersResult,
    queryResult,
    bodyResult,
  };
};

export const createLambdaHandler = <T extends AppRouter>(
  routes: T,
  obj: RecursiveRouterObj<T>,
  options?: {}
) => {
  const router = Router<
    TsRestRequest,
    [requestContext: ApiGatewayEvent['requestContext'], lambdaContext: Context]
  >();

  router.all('*', withParams as any);

  recursivelyProcessContract({
    schema: routes,
    router: obj,
    processRoute: (implementation, schema) => {
      const routeHandler = async (
        request: TsRestRequest,
        requestContext: ApiGatewayEvent['requestContext'],
        lambdaContext: Context
      ) => {
        const validationResults = validateRequest(request, schema);

        const result = await implementation({
          // @ts-expect-error TODO: fix this
          params: validationResults.paramsResult.data as any,
          body: validationResults.bodyResult.data as any,
          query: validationResults.queryResult.data as any,
          headers: validationResults.headersResult.data as any,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          files: req.files,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          file: req.file,
          requestContext,
          lambdaContext,
        });

        const statusCode = Number(result.status);

        return result.body;
      };

      switch (schema.method) {
        case 'GET':
          router.get(schema.path, routeHandler);
          break;
        case 'DELETE':
          router.delete(schema.path, routeHandler);
          break;
        case 'POST':
          router.post(schema.path, routeHandler);
          break;
        case 'PUT':
          router.put(schema.path, routeHandler);
          break;
        case 'PATCH':
          router.patch(schema.path, routeHandler);
          break;
      }
    },
  });

  return async (event: ApiGatewayEvent, context: Context) => {
    const request = requestFromEvent(event);

    return router.handle(request, event.requestContext, context).then(() => {
      return new Response('Not Found', { status: 404 });
    });
  };
};
