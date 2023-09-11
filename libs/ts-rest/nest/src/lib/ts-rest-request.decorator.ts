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
import { JsonQuerySymbol, TsRestAppRouteMetadataKey } from './constants';
import { TsRestOptions } from './ts-rest.decorator';

export type TsRestRequestShape<TRoute extends AppRoute> = ServerInferRequest<
  TRoute,
  Request['headers']
>;

/**
 * Parameter decorator used to parse, validate and return the typed request object
 */
export const TsRestRequest = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): TsRestRequestShape<AppRouteMutation> => {
    const req: Request | FastifyRequest = ctx.switchToHttp().getRequest();

    const rawRequest: any = 'raw' in req ? req.raw : req;
    const tsRestOptions = rawRequest.tsRestOptions as
      | TsRestOptions
      | null
      | undefined;

    const appRoute: AppRouteMutation | undefined = Reflect.getMetadata(
      TsRestAppRouteMetadataKey,
      ctx.getHandler()
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @TsRest()');
    }

    const pathParamsResult = checkZodSchema(req.params, appRoute.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!pathParamsResult.success) {
      throw new BadRequestException(zodErrorResponse(pathParamsResult.error));
    }

    const headersResult = checkZodSchema(req.headers, appRoute.headers, {
      passThroughExtraKeys: true,
    });

    if (!headersResult.success) {
      throw new BadRequestException(zodErrorResponse(headersResult.error));
    }

    const isJsonQuery = !!(
      Reflect.getMetadata(JsonQuerySymbol, ctx.getHandler()) ??
      Reflect.getMetadata(JsonQuerySymbol, ctx.getClass()) ??
      tsRestOptions?.jsonQuery
    );

    const query = isJsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, appRoute.query);

    if (!queryResult.success) {
      throw new BadRequestException(zodErrorResponse(queryResult.error));
    }

    const bodyResult = checkZodSchema(
      req.body,
      (appRoute as AppRoute).method === 'GET' ? null : appRoute.body
    );

    if (!bodyResult.success) {
      throw new BadRequestException(zodErrorResponse(bodyResult.error));
    }

    return {
      query: queryResult.data,
      params: pathParamsResult.data as any,
      body: bodyResult.data as any,
      headers: headersResult.data as TsRestRequestShape<
        typeof appRoute
      >['headers'],
    };
  }
);

/**
 * @deprecated Use `TsRestRequest` instead
 */
export const ApiDecorator = TsRestRequest;
