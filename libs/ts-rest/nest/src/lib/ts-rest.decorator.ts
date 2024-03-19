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
import { TsRestInterceptor } from './ts-rest.interceptor';
import {
  TsRestAppRouteMetadataKey,
  ValidateRequestBodySymbol,
  ValidateRequestHeadersSymbol,
  ValidateRequestQuerySymbol,
  ValidateResponsesSymbol,
} from './constants';

export type TsRestOptions = {
  jsonQuery?: boolean;
  validateResponses?: boolean;
  validateRequestHeaders?: boolean;
  validateRequestQuery?: boolean;
  validateRequestBody?: boolean;
};

type TsRestType = {
  (appRoute: AppRoute, options?: TsRestOptions): MethodDecorator;
  (options: TsRestOptions): ClassDecorator;
};

/**
 * As a class decorator, you can configure ts-rest options. As a method decorator, you can assign the route and also configure options
 * @param appRouteOrOptions For a method decorator, this is the route. For a class decorator, this is the options
 * @param options For a method decorator, this is the options
 */
export const TsRest: TsRestType = (
  appRouteOrOptions: AppRoute | TsRestOptions,
  options: TsRestOptions = {},
) => {
  const decorators = [];

  const isMethodDecorator = 'path' in appRouteOrOptions;
  const optionsToUse = isMethodDecorator ? options : appRouteOrOptions;

  if (isMethodDecorator) {
    decorators.push(
      ...[
        SetMetadata(TsRestAppRouteMetadataKey, appRouteOrOptions),
        getMethodDecorator(appRouteOrOptions),
        UseInterceptors(TsRestInterceptor),
      ],
    );
  } else {
    // set request validation metadata for class decoration
    decorators.push(
      SetMetadata(
        ValidateRequestHeadersSymbol,
        optionsToUse.validateRequestHeaders ?? true,
      ),
      SetMetadata(
        ValidateRequestQuerySymbol,
        optionsToUse.validateRequestQuery ?? true,
      ),
      SetMetadata(
        ValidateRequestBodySymbol,
        optionsToUse.validateRequestBody ?? true,
      ),
    );
  }

  if (optionsToUse.jsonQuery !== undefined) {
    decorators.push(JsonQuery(optionsToUse.jsonQuery));
  }

  if (optionsToUse.validateResponses !== undefined) {
    decorators.push(
      SetMetadata(ValidateResponsesSymbol, optionsToUse.validateResponses),
    );
  }

  // set request validation metadata for method decoration
  if (optionsToUse.validateRequestBody !== undefined) {
    decorators.push(
      SetMetadata(ValidateRequestBodySymbol, optionsToUse.validateRequestBody),
    );
  }
  if (optionsToUse.validateRequestQuery !== undefined) {
    decorators.push(
      SetMetadata(
        ValidateRequestQuerySymbol,
        optionsToUse.validateRequestQuery,
      ),
    );
  }
  if (optionsToUse.validateRequestHeaders !== undefined) {
    decorators.push(
      SetMetadata(
        ValidateRequestHeadersSymbol,
        optionsToUse.validateRequestHeaders,
      ),
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
