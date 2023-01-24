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
  PathParamsWithCustomValidators,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import type { Request } from 'express-serve-static-core';
import { JsonQuerySymbol } from './json-query.decorator';

export const tsRestAppRouteMetadataKey = Symbol('ts-rest-app-route');

type BodyWithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

export type TsRestRequestShape<TRoute extends AppRoute> = Without<
  {
    params: PathParamsWithCustomValidators<TRoute>;
    body: TRoute extends AppRouteMutation
      ? BodyWithoutFileIfMultiPart<TRoute>
      : never;
    query: ZodInferOrType<TRoute['query']>;
  },
  never
>;

export const TsRestRequest = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): TsRestRequestShape<any> => {
    const req: Request = ctx.switchToHttp().getRequest();
    const appRoute: AppRoute | undefined = Reflect.getMetadata(
      tsRestAppRouteMetadataKey,
      ctx.getHandler()
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @Api()');
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
      throw new BadRequestException(queryResult.error);
    }

    const bodyResult = checkZodSchema(
      req.body,
      appRoute.method === 'GET' ? null : appRoute.body
    );

    if (!bodyResult.success) {
      throw new BadRequestException(bodyResult.error);
    }

    const pathParamsResult = checkZodSchema(req.params, appRoute.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!pathParamsResult.success) {
      throw new BadRequestException(pathParamsResult.error);
    }

    return {
      query: queryResult.data,
      params: pathParamsResult.data,
      body: bodyResult.data,
    };
  }
);

/**
 * @deprecated Use `TsRestRequest` instead
 */
export const ApiDecorator = TsRestRequest;
