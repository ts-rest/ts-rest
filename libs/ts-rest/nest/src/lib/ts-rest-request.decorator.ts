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
import { JsonQuerySymbol, TsRestAppRouteMetadataKey } from './constants';

export type TsRestRequestShape<
  TRoute extends AppRoute,
  TRequest extends ServerInferRequest<TRoute> = ServerInferRequest<TRoute>
> = Omit<TRequest, 'headers'> & {
  headers: TRequest['headers'] & Request['headers'];
};

type AppRouteMutationWithParams = AppRouteMutation & { path: '/:placeholder' };

/**
 * Parameter decorator used to parse, validate and return the typed request object
 */
export const TsRestRequest = createParamDecorator(
  (
    _: unknown,
    ctx: ExecutionContext
  ): TsRestRequestShape<AppRouteMutationWithParams> => {
    const req: Request = ctx.switchToHttp().getRequest();

    const appRoute: AppRouteMutationWithParams | undefined =
      Reflect.getMetadata(TsRestAppRouteMetadataKey, ctx.getHandler());

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
      Reflect.getMetadata(JsonQuerySymbol, ctx.getClass())
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
