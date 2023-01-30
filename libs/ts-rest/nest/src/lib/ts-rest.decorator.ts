import {
  applyDecorators,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { JsonQuery } from './json-query.decorator';
import { AppRoute } from '@ts-rest/core';
import { tsRestAppRouteMetadataKey } from './ts-rest-request.decorator';
import { TsRestInterceptor } from './ts-rest.interceptor';

export const ValidateResponsesSymbol = Symbol('ts-rest-validate-responses');

export type TsRestOptions = {
  jsonQuery?: boolean;
  validateResponses?: boolean;
};

/**
 * As a class decorator, you can configure ts-rest options. As a method decorator, you can assign the route and also configure options
 * @param appRouteOrOptions For a method decorator, this is the route. For a class decorator, this is the options
 * @param options For a method decorator, this is the options
 */
export const TsRest = (
  appRouteOrOptions: AppRoute | TsRestOptions,
  options: TsRestOptions = {}
) => {
  const decorators = [];

  const isMethodDecorator = 'path' in appRouteOrOptions;
  const optionsToUse = isMethodDecorator ? options : appRouteOrOptions;

  if (isMethodDecorator) {
    decorators.push(
      ...[
        SetMetadata(tsRestAppRouteMetadataKey, appRouteOrOptions),
        getMethodDecorator(appRouteOrOptions),
        UseInterceptors(TsRestInterceptor),
      ]
    );
  }

  if (optionsToUse.jsonQuery !== undefined) {
    decorators.push(JsonQuery(optionsToUse.jsonQuery));
  }

  if (optionsToUse.validateResponses !== undefined) {
    decorators.push(
      SetMetadata(ValidateResponsesSymbol, optionsToUse.validateResponses)
    );
  }

  return applyDecorators(...decorators);
};

const getMethodDecorator = (appRoute: AppRoute) => {
  switch (appRoute.method) {
    case 'DELETE':
      return Delete(appRoute.path);
    case 'GET':
      return Get(appRoute.path);
    case 'POST':
      return Post(appRoute.path);
    case 'PATCH':
      return Patch(appRoute.path);
    case 'PUT':
      return Put(appRoute.path);
  }
};

/**
 * @deprecated Use TsRest decorator instead
 */
export const Api = (appRoute: AppRoute): MethodDecorator => {
  return TsRest(appRoute) as MethodDecorator;
};
