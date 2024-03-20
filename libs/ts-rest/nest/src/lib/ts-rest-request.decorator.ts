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
import {
  JsonQuerySymbol,
  TsRestAppRouteMetadataKey,
  ValidateRequestBodySymbol,
  ValidateRequestHeadersSymbol,
  ValidateRequestQuerySymbol,
  ValidateResponsesSymbol,
} from './constants';
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
      ctx.getHandler(),
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

    // by default request validation metadata doesn't set for the method to take option to override class params
    const getRequestValidationValue = (
      key:
        | typeof ValidateRequestHeadersSymbol
        | typeof ValidateRequestQuerySymbol
        | typeof ValidateRequestBodySymbol,
    ) => {
      const handlerValue = Reflect.getMetadata(key, ctx.getHandler());
      const classValue = Reflect.getMetadata(key, ctx.getClass());

      // in case decorator used only on method & option not provided
      if (handlerValue === undefined && classValue === undefined) {
        return true;
      }

      // prefer to use method param if available
      if (handlerValue !== undefined) {
        return handlerValue;
      }

      return classValue;
    };

    const headersResult = checkZodSchema(req.headers, appRoute.headers, {
      passThroughExtraKeys: true,
    });

    const headerValidation = getRequestValidationValue(
      ValidateRequestHeadersSymbol,
    );
    if (!headersResult.success && headerValidation) {
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
    const queryValidation = getRequestValidationValue(
      ValidateRequestQuerySymbol,
    );
    if (!queryResult.success && queryValidation) {
      throw new BadRequestException(zodErrorResponse(queryResult.error));
    }

    const bodyResult = checkZodSchema(
      req.body,
      (appRoute as AppRoute).method === 'GET' ? null : appRoute.body,
    );

    const bodyValidation = getRequestValidationValue(ValidateRequestBodySymbol);
    if (!bodyResult.success && bodyValidation) {
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
