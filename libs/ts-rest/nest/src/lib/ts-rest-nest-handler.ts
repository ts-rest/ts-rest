import { Reflector } from '@nestjs/core';
import { mergeMap, Observable } from 'rxjs';
import type { Request, Response } from 'express';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  BadRequestException,
  CallHandler,
  Delete,
  ExecutionContext,
  Get,
  HttpException,
  HttpExceptionOptions,
  Inject,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  Optional,
  Patch,
  Post,
  Put,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import {
  AppRoute,
  AppRouter,
  areAllSchemasLegacyZod,
  isAppRoute,
  isAppRouteOtherResponse,
  parseAsStandardSchema,
  parseJsonQueryObject,
  ServerInferResponses,
  StandardSchemaError,
  TsRestResponseError,
  validateMultiSchemaObject,
  validateIfSchema,
} from '@ts-rest/core';
import {
  TsRestAppRouteMetadataKey,
  TsRestOptionsMetadataKey,
} from './constants';
import { TsRestRequestShape } from './ts-rest-request.decorator';
import { TS_REST_MODULE_OPTIONS_TOKEN } from './ts-rest.module';
import {
  evaluateTsRestOptions,
  MaybeTsRestOptions,
  TsRestOptions,
} from './ts-rest-options';
import { type ZodError } from 'zod';

type TsRestAppRouteMetadata = {
  appRoute: AppRoute;
  /**
   * if we're in a multi handler, this is the key of the route e.g. `getHello`
   * inside a contract with multiple handlers
   *
   * Otherwise, it's null, i.e. single handler
   */
  routeKey: string | null;
};

export class TsRestRequestValidationError extends BadRequestException {
  constructor(
    public pathParams: StandardSchemaError | null,
    public headers: StandardSchemaError | null,
    public query: StandardSchemaError | null,
    public body: StandardSchemaError | null,
  ) {
    super({
      paramsResult: pathParams,
      headersResult: headers,
      queryResult: query,
      bodyResult: body,
    });
  }
}

export class RequestValidationError extends BadRequestException {
  constructor(
    public pathParams: ZodError | null,
    public headers: ZodError | null,
    public query: ZodError | null,
    public body: ZodError | null,
  ) {
    super({
      paramsResult: pathParams,
      headersResult: headers,
      queryResult: query,
      bodyResult: body,
    });
  }
}

export { RequestValidationErrorSchemaForNest as RequestValidationErrorSchema } from '@ts-rest/core';

/**
 * Error emitted when response validation fails (when using a standard schema validator)
 *
 * This is the new standard
 */
export class TsRestResponseValidationError extends InternalServerErrorException {
  constructor(
    public appRoute: AppRoute,
    public error: StandardSchemaError,
  ) {
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${error.message}`,
    );
  }
}

/**
 * @deprecated use TsRestResponseValidationError instead, this will be removed in v4
 */
export class ResponseValidationError extends InternalServerErrorException {
  constructor(
    public appRoute: AppRoute,
    public error: ZodError,
  ) {
    super(
      `[ts-rest] Response validation failed for ${appRoute.method} ${appRoute.path}: ${error.message}`,
    );
  }
}

const getHttpVerbDecorator = (route: AppRoute) => {
  switch (route.method) {
    case 'GET':
      return Get(route.path);
    case 'POST':
      return Post(route.path);
    case 'PUT':
      return Put(route.path);
    case 'PATCH':
      return Patch(route.path);
    case 'DELETE':
      return Delete(route.path);
  }
};

export const TsRestHandler = (
  appRouterOrRoute: AppRouter | AppRoute,
  options?: TsRestOptions,
): MethodDecorator => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const isMultiHandler = !isAppRoute(appRouterOrRoute);

    /**
     * To make multi handler work we've got to do a trick with virtual methods in the class:
     *
     * Originally we used the @All decorator on the original method, but this has issues with different controllers conflicting
     *
     * Now, we make a new method for each route in the router, and apply the appropriate decorator to it.
     *
     * e.g. say there is a contract with two methods, `getPost` and `updatePost`
     *
     * we create two new methods in the class, `handler_getPost` and `handler_updatePost`
     * and decorate @Get on the first and @Put on the second
     *
     * Then, we call the original method from the new method
     */
    if (isMultiHandler) {
      const originalMethod = descriptor.value;

      // Get parameter metadata using Nest's internal key
      const ROUTE_ARGS_METADATA = '__routeArguments__';
      const originalParamMetadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        target.constructor,
        propertyKey,
      );

      Object.entries(appRouterOrRoute).forEach(([routeKey, route]) => {
        if (isAppRoute(route)) {
          const methodName = `${String(propertyKey)}_${routeKey}`;

          // Create new method that calls original
          target[methodName] = async function (...args: any[]) {
            return originalMethod.apply(this, args);
          };

          if (originalParamMetadata) {
            Reflect.defineMetadata(
              ROUTE_ARGS_METADATA,
              originalParamMetadata,
              target.constructor,
              methodName,
            );
          }

          const paramTypes = Reflect.getMetadata(
            'design:paramtypes',
            target,
            propertyKey,
          );
          if (paramTypes) {
            Reflect.defineMetadata(
              'design:paramtypes',
              paramTypes,
              target,
              methodName,
            );
          }

          const HttpVerbDecorator = getHttpVerbDecorator(route);
          HttpVerbDecorator(
            target,
            methodName,
            Object.getOwnPropertyDescriptor(target, methodName)!,
          );

          const reflector = new Reflector();
          const metadataKeys = Reflect.getMetadataKeys(descriptor.value);

          metadataKeys.forEach((key) => {
            const metadata = reflector.get(key, descriptor.value);
            if (metadata) {
              SetMetadata(key, metadata)(
                target,
                methodName,
                Object.getOwnPropertyDescriptor(target, methodName)!,
              );
            }
          });

          if (options) {
            SetMetadata(TsRestOptionsMetadataKey, options)(
              target,
              methodName,
              Object.getOwnPropertyDescriptor(target, methodName)!,
            );
          }

          SetMetadata(TsRestAppRouteMetadataKey, {
            appRoute: route,
            routeKey,
          } satisfies TsRestAppRouteMetadata)(
            target,
            methodName,
            Object.getOwnPropertyDescriptor(target, methodName)!,
          );

          UseInterceptors(TsRestHandlerInterceptor)(
            target,
            methodName,
            Object.getOwnPropertyDescriptor(target, methodName)!,
          );
        }
      });

      return descriptor;
    } else {
      /**
       * On the single handler we can just apply the HttpVerb decorator to the original method
       */
      if (!isAppRoute(appRouterOrRoute)) {
        throw new Error('Expected app route but received app router');
      }

      const HttpVerbDecorator = getHttpVerbDecorator(appRouterOrRoute);
      HttpVerbDecorator(target, propertyKey, descriptor);

      if (options) {
        SetMetadata(TsRestOptionsMetadataKey, options)(
          target,
          propertyKey,
          descriptor,
        );
      }

      SetMetadata(TsRestAppRouteMetadataKey, {
        appRoute: appRouterOrRoute,
        routeKey: null,
      } satisfies TsRestAppRouteMetadata)(target, propertyKey, descriptor);
      UseInterceptors(TsRestHandlerInterceptor)(
        target,
        propertyKey,
        descriptor,
      );

      return descriptor;
    }
  };
};

type NestHandlerImplementation<T extends AppRouter | AppRoute> =
  T extends AppRoute
    ? (args: TsRestRequestShape<T>) => Promise<ServerInferResponses<T>>
    : {
        [K in keyof T]: T[K] extends AppRoute
          ? (
              args: TsRestRequestShape<T[K]>,
            ) => Promise<ServerInferResponses<T[K]>>
          : never;
      };

/**
 *
 * @param contract - The contract or route to implement
 * @param implementation - Implementation of the route or entire contract as an object
 * @returns
 */
export const tsRestHandler = <T extends AppRouter | AppRoute>(
  contract: T,
  implementation: NestHandlerImplementation<T>,
) => implementation;

/**
 * Error you can throw to return a response from a handler
 */
export class TsRestException<T extends AppRoute> extends HttpException {
  constructor(
    route: T,
    response: ServerInferResponses<T>,
    options?: HttpExceptionOptions,
  ) {
    super(response.body as Record<string, any>, response.status, options);
  }
}

@Injectable()
export class TsRestHandlerInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Optional()
    @Inject(TS_REST_MODULE_OPTIONS_TOKEN)
    private globalOptions: MaybeTsRestOptions,
  ) {}

  /**
   * We use metadata to store the route, and the key of the route in a router on a given method
   */
  private getAppRouteFromContext(
    ctx: ExecutionContext,
  ): TsRestAppRouteMetadata {
    const appRouteMetadata = this.reflector.get<
      TsRestAppRouteMetadata | undefined
    >(TsRestAppRouteMetadataKey, ctx.getHandler());

    if (!appRouteMetadata) {
      throw new Error(
        'Could not find app router or app route, ensure you are using the @TsRestHandler decorator on your method',
      );
    }

    if (!isAppRoute(appRouteMetadata.appRoute)) {
      throw new Error('Expected app route but received app router');
    }

    return appRouteMetadata;
  }

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const res: Response | FastifyReply = ctx.switchToHttp().getResponse();
    const req: Request | FastifyRequest = ctx.switchToHttp().getRequest();

    const { appRoute, routeKey } = this.getAppRouteFromContext(ctx);

    const options = evaluateTsRestOptions(this.globalOptions, ctx);

    const paramsResult = validateIfSchema(req.params, appRoute.pathParams, {
      passThroughExtraKeys: true,
    });

    const headersResult = validateMultiSchemaObject(
      req.headers,
      appRoute.headers,
    );

    const query = options.jsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = validateIfSchema(query, appRoute.query);

    const bodyResult = validateIfSchema(
      req.body,
      'body' in appRoute ? appRoute.body : null,
    );

    const isHeadersInvalid =
      headersResult.error && options.validateRequestHeaders;

    const isQueryInvalid = queryResult.error && options.validateRequestQuery;

    const isBodyInvalid = bodyResult.error && options.validateRequestBody;

    if (
      paramsResult.error ||
      isHeadersInvalid ||
      isQueryInvalid ||
      isBodyInvalid
    ) {
      const useLegacyZod = areAllSchemasLegacyZod([
        ...paramsResult.schemasUsed,
        ...queryResult.schemasUsed,
        ...bodyResult.schemasUsed,
        ...headersResult.schemasUsed,
      ]);

      if (useLegacyZod) {
        throw new RequestValidationError(
          (paramsResult.error as ZodError) || null,
          (headersResult.error as ZodError) || null,
          (queryResult.error as ZodError) || null,
          (bodyResult.error as ZodError) || null,
        );
      } else {
        throw new TsRestRequestValidationError(
          (paramsResult.error as StandardSchemaError) || null,
          (headersResult.error as StandardSchemaError) || null,
          (queryResult.error as StandardSchemaError) || null,
          (bodyResult.error as StandardSchemaError) || null,
        );
      }
    }

    return next.handle().pipe(
      mergeMap(async (impl) => {
        let result = null;
        try {
          const res = {
            params: paramsResult.value,
            query: queryResult.value || req.query,
            body: bodyResult.value || req.body,
            headers: headersResult.value || req.headers,
          };

          /**
           * If we have a routeKey that means we're in a multi handler, and therefore we
           * need to call the appropriate method WITHIN the implementation object
           */
          result = routeKey ? await impl[routeKey](res) : await impl(res);
        } catch (e) {
          if (e instanceof TsRestException) {
            result = {
              status: e.getStatus(),
              body: e.getResponse(),
              error: e,
            };
          } else if (e instanceof TsRestResponseError) {
            result = {
              status: e.statusCode,
              body: e.body,
            };
          } else {
            throw e;
          }
        }

        const responseAfterValidation = options.validateResponses
          ? validateResponse(appRoute, result)
          : result;

        const responseType = appRoute.responses[result.status];

        if (result.error) {
          throw new HttpException(
            responseAfterValidation.body,
            responseAfterValidation.status,
            {
              cause: result.error,
            },
          );
        }

        if (isAppRouteOtherResponse(responseType)) {
          if ('setHeader' in res) {
            res.setHeader('content-type', responseType.contentType);
          } else {
            res.header('content-type', responseType.contentType);
          }
        }

        res.status(responseAfterValidation.status);
        return responseAfterValidation.body;
      }),
    );
  }
}

const validateResponse = (
  appRoute: AppRoute,
  response: { status: number; body?: unknown },
): { body: unknown; status: number } => {
  const { body } = response;

  const responseType = appRoute.responses[response.status];
  const responseSchema = isAppRouteOtherResponse(responseType)
    ? responseType.body
    : responseType;

  if (!responseSchema) {
    throw new InternalServerErrorException(
      `[ts-rest] Couldn't find a response schema for ${response.status} on route ${appRoute.path}`,
    );
  }

  const responseStandardSchema = parseAsStandardSchema(
    appRoute.responses[response.status],
  );
  const responseValidation = validateIfSchema(body, responseStandardSchema);

  if (responseValidation.error) {
    const { error } = responseValidation;

    const isZodSchema = areAllSchemasLegacyZod([responseStandardSchema]);

    if (isZodSchema) {
      throw new ResponseValidationError(appRoute, error as ZodError);
    } else {
      throw new TsRestResponseValidationError(
        appRoute,
        error as StandardSchemaError,
      );
    }
  }

  return {
    status: response.status,
    body: responseValidation.value,
  };
};
