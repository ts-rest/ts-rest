import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import {
  AppRoute,
  AppRouteMutation,
  checkZodSchema,
  parseJsonQueryObject,
  ServerInferRequest,
  zodErrorResponse,
} from '@ts-rest/core';
import type { Request } from 'express-serve-static-core';
import type { FastifyRequest } from 'fastify';
import { TsRestAppRouteMetadataKey } from './constants';
import { evaluateTsRestOptions, MaybeTsRestOptions } from './ts-rest-options';

export type TsRestRequestShape<TRoute extends AppRoute> = ServerInferRequest<
  TRoute,
  Request['headers']
>;

/**
 * Parameter decorator used to parse, validate and return the typed request object
 */
export const TsRestRequest = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): TsRestRequestShape<AppRouteMutation> => {
    const appRoute: AppRouteMutation | undefined = Reflect.getMetadata(
      TsRestAppRouteMetadataKey,
      ctx.getHandler(),
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @TsRest()');
    }

    const req: Request | FastifyRequest = ctx.switchToHttp().getRequest();
    const rawRequest: any = 'raw' in req ? req.raw : req;
    const globalOptions = rawRequest.tsRestGlobalOptions as MaybeTsRestOptions;
    const options = evaluateTsRestOptions(globalOptions, ctx);

    const pathParamsResult = checkZodSchema(req.params, appRoute.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!pathParamsResult.success) {
      throw new BadRequestException(zodErrorResponse(pathParamsResult.error));
    }

    const headersResult = checkZodSchema(req.headers, appRoute.headers, {
      passThroughExtraKeys: true,
    });

    if (!headersResult.success && options.validateRequestHeaders) {
      throw new BadRequestException(zodErrorResponse(headersResult.error));
    }

    const query = options.jsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, appRoute.query);
    if (!queryResult.success && options.validateRequestQuery) {
      throw new BadRequestException(zodErrorResponse(queryResult.error));
    }

    const bodyResult = checkZodSchema(
      req.body,
      (appRoute as AppRoute).method === 'GET' ? null : appRoute.body,
    );

    if (!bodyResult.success && options.validateRequestBody) {
      throw new BadRequestException(zodErrorResponse(bodyResult.error));
    }

    return {
      query: queryResult.success ? queryResult.data : req.query,
      params: pathParamsResult.data as any,
      body: bodyResult.success ? bodyResult.data : req.body,
      headers: headersResult.success
        ? (headersResult.data as TsRestRequestShape<typeof appRoute>['headers'])
        : req.headers,
    };
  },
);

/**
 * @deprecated Use `TsRestRequest` instead
 */
export const ApiDecorator = TsRestRequest;
