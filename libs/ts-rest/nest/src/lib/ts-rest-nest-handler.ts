import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import type { Response, Request } from 'express-serve-static-core';
import {
  All,
  SetMetadata,
  UseInterceptors,
  applyDecorators,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  createParamDecorator,
  BadRequestException,
  NotFoundException,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AppRouter,
  isAppRoute,
  AppRoute,
  checkZodSchema,
  parseJsonQueryObject,
  ServerInferResponses,
  isAppRouteResponse,
} from '@ts-rest/core';
import {
  JsonQuerySymbol,
  TsRestAppRouteMetadataKey,
  TsRestAppRouterMetadataKey,
  ValidateResponsesSymbol,
} from './constants';
import { TsRestRequestShape } from './ts-rest-request.decorator';
import { z } from 'zod';
import { TsRestOptions } from './ts-rest.decorator';
import { JsonQuery } from './json-query.decorator';

export class RequestValidationError extends BadRequestException {
  constructor(
    public pathParams: z.ZodError | null,
    public headers: z.ZodError | null,
    public query: z.ZodError | null,
    public body: z.ZodError | null
  ) {
    super({
      paramsResult: pathParams,
      headersResult: headers,
      queryResult: query,
      bodyResult: body,
    });
  }
}

export class ResponseValidationError extends InternalServerErrorException {
  constructor(appRoute: AppRoute, error: z.ZodError) {
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${error.message}`
    );
  }
}

export const TsRestHandler = (
  appRouterOrRoute: AppRouter | AppRoute,
  options: TsRestOptions = {}
): MethodDecorator => {
  const decorators = [];

  if (options.jsonQuery !== undefined) {
    decorators.push(JsonQuery(options.jsonQuery));
  }

  if (options.validateResponses !== undefined) {
    decorators.push(
      SetMetadata(ValidateResponsesSymbol, options.validateResponses)
    );
  }

  const isMultiHandler = !isAppRoute(appRouterOrRoute);

  if (isMultiHandler) {
    const routerPaths: string[] = [];

    Object.entries(appRouterOrRoute).forEach(([key, value]) => {
      if (isAppRoute(value)) {
        routerPaths.push(value.path);
      }
    });

    decorators.push(
      All(routerPaths),
      SetMetadata(TsRestAppRouterMetadataKey, appRouterOrRoute),
      UseInterceptors(TsRestHandlerInterceptor)
    );
  } else {
    const apiDecorator = (() => {
      switch (appRouterOrRoute.method) {
        case 'GET':
          return Get(appRouterOrRoute.path);
        case 'POST':
          return Post(appRouterOrRoute.path);
        case 'PUT':
          return Put(appRouterOrRoute.path);
        case 'PATCH':
          return Patch(appRouterOrRoute.path);
        case 'DELETE':
          return Delete(appRouterOrRoute.path);
      }
    })();

    decorators.push(
      apiDecorator,
      SetMetadata(TsRestAppRouteMetadataKey, appRouterOrRoute),
      UseInterceptors(TsRestHandlerInterceptor)
    );
  }

  return applyDecorators(...decorators);
};

type NestHandlerImplementation<T extends AppRouter | AppRoute> =
  T extends AppRoute
    ? (args: TsRestRequestShape<T>) => Promise<ServerInferResponses<T>>
    : {
        [K in keyof T]: T[K] extends AppRoute
          ? (
              args: TsRestRequestShape<T[K]>
            ) => Promise<ServerInferResponses<T[K]>>
          : never;
      };

export const tsRestHandler = <T extends AppRouter | AppRoute>(
  contract: T,
  implementation: NestHandlerImplementation<T>
) => implementation;

export const doesUrlMatchContractPath = (
  /**
   * @example '/posts/:id'
   */
  contractPath: string,
  /**
   * @example '/posts/1'
   */
  url: string
): boolean => {
  const contractPathParts = contractPath.split('/');

  const urlParts = url.split('/');

  if (contractPathParts.length !== urlParts.length) {
    return false;
  }

  for (let i = 0; i < contractPathParts.length; i++) {
    const contractPathPart = contractPathParts[i];
    const urlPart = urlParts[i];

    if (contractPathPart.startsWith(':')) {
      continue;
    }

    if (contractPathPart !== urlPart) {
      return false;
    }
  }

  return true;
};

@Injectable()
export class TsRestHandlerInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  private getAppRouteFromContext(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();

    const appRoute = this.reflector.get<AppRoute | undefined>(
      TsRestAppRouteMetadataKey,
      ctx.getHandler()
    );

    if (appRoute) {
      return {
        appRoute,
        routeAlias: undefined,
      };
    }

    /**
     * Therefore we must be on a multi-handler so let's get the route in the router
     */
    const appRouter = this.reflector.get<AppRouter | undefined>(
      TsRestAppRouterMetadataKey,
      ctx.getHandler()
    );

    if (!appRouter) {
      throw new Error(
        'Could not find app router or app route, ensure you are using the @TsRestHandler decorator on your method'
      );
    }

    const foundAppRoute = Object.entries(appRouter).find(([key, value]) => {
      if (isAppRoute(value)) {
        return (
          doesUrlMatchContractPath(value.path, req.path) &&
          req.method === value.method
        );
      }

      return null;
    }) as [string, AppRoute] | undefined;

    if (!foundAppRoute) {
      throw new NotFoundException("Couldn't find route handler for this path");
    }

    return {
      appRoute: foundAppRoute[1],
      routeAlias: foundAppRoute[0],
    };
  }

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const res: Response = ctx.switchToHttp().getResponse();
    const req: Request = ctx.switchToHttp().getRequest();

    const { appRoute, routeAlias } = this.getAppRouteFromContext(ctx);

    const isJsonQuery = !!(
      Reflect.getMetadata(JsonQuerySymbol, ctx.getHandler()) ??
      Reflect.getMetadata(JsonQuerySymbol, ctx.getClass())
    );

    const isValidationEnabled = Boolean(
      this.reflector.getAllAndOverride<boolean | undefined>(
        ValidateResponsesSymbol,
        [ctx.getHandler(), ctx.getClass()]
      )
    );

    const paramsResult = checkZodSchema(req.params, appRoute.pathParams, {
      passThroughExtraKeys: true,
    });

    const headersResult = checkZodSchema(req.headers, appRoute.headers, {
      passThroughExtraKeys: true,
    });

    const query = isJsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, appRoute.query);

    const bodyResult = checkZodSchema(
      req.body,
      'body' in appRoute ? appRoute.body : null
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

    return next.handle().pipe(
      map(async (impl) => {
        const result = routeAlias
          ? await impl[routeAlias]({
              query: queryResult.data,
              params: paramsResult.data,
              body: bodyResult.data,
              headers: headersResult.data,
            })
          : await impl({
              query: queryResult.data,
              params: paramsResult.data,
              body: bodyResult.data,
              headers: headersResult.data,
            });

        const responseAfterValidation = isValidationEnabled
          ? validateResponse(appRoute, result)
          : result;

        res.status(responseAfterValidation.status);
        return responseAfterValidation.body;
      })
    );
  }
}

export const validateResponse = (
  appRoute: AppRoute,
  response: { status: number; body?: unknown }
) => {
  const { body } = response;

  const responseSchema = appRoute.responses[response.status];

  if (!responseSchema) {
    throw new InternalServerErrorException(
      `[ts-rest] Couldn't find a response schema for ${response.status} on route ${appRoute.path}`
    );
  }

  const responseValidation = checkZodSchema(
    body,
    appRoute.responses[response.status]
  );

  if (!responseValidation.success) {
    const { error } = responseValidation;

    throw new ResponseValidationError(appRoute, error);
  }

  return {
    status: response.status,
    body: responseValidation.data,
  };
};
