import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import type { Response, Request } from 'express-serve-static-core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  All,
  SetMetadata,
  UseInterceptors,
  applyDecorators,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  NotFoundException,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import {
  AppRouter,
  isAppRoute,
  AppRoute,
  checkZodSchema,
  parseJsonQueryObject,
  ServerInferResponses,
  isAppRouteOtherResponse,
} from '@ts-rest/core';
import {
  JsonQuerySymbol,
  TsRestAppRouteMetadataKey,
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
  constructor(public appRoute: AppRoute, public error: z.ZodError) {
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
    const routerPaths: Set<string> = new Set();

    Object.values(appRouterOrRoute).forEach((value) => {
      if (isAppRoute(value)) {
        routerPaths.add(value.path);
      }
    });

    const routerPathsArray = Array.from(routerPaths);

    decorators.push(
      All(routerPathsArray),
      SetMetadata(TsRestAppRouteMetadataKey, appRouterOrRoute),
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

/**
 *
 * @param contract - The contract or route to implement
 * @param implementation - Implementation of the route or entire contract as an object
 * @returns
 */
export const tsRestHandler = <T extends AppRouter | AppRoute>(
  contract: T,
  implementation: NestHandlerImplementation<T>
) => implementation;

/**
 * Error you can throw to return a response from a handler
 */
export class TsRestException<T extends AppRoute> extends HttpException {
  constructor(route: T, response: ServerInferResponses<T>) {
    super(response.body as Record<string, any>, response.status);
  }
}

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
  // strip trailing slash
  if (contractPath !== '/' && contractPath.endsWith('/')) {
    contractPath = contractPath.slice(0, -1);
  }

  if (url !== '/' && url.endsWith('/')) {
    url = url.slice(0, -1);
  }

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
  private reflector = new Reflector();

  private getAppRouteFromContext(ctx: ExecutionContext) {
    const req: Request | FastifyRequest = ctx.switchToHttp().getRequest();

    const appRoute = this.reflector.get<AppRoute | AppRouter | undefined>(
      TsRestAppRouteMetadataKey,
      ctx.getHandler()
    );

    if (!appRoute) {
      throw new Error(
        'Could not find app router or app route, ensure you are using the @TsRestHandler decorator on your method'
      );
    }

    if (isAppRoute(appRoute)) {
      return {
        appRoute,
        routeAlias: undefined,
      };
    }

    const appRouter = appRoute;

    const foundAppRoute = Object.entries(appRouter).find(([, value]) => {
      if (isAppRoute(value)) {
        return (
          doesUrlMatchContractPath(
            value.path,
            'path' in req ? req.path : req.routerPath
          ) && req.method === value.method
        );
      }

      return null;
    }) as [string, AppRoute] | undefined;

    if (!foundAppRoute) {
      throw new NotFoundException("Couldn't find route handler for this path");
    }

    return {
      appRoute: foundAppRoute[1],
      routeKey: foundAppRoute[0],
    };
  }

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const res: Response | FastifyReply = ctx.switchToHttp().getResponse();
    const req: Request | FastifyRequest = ctx.switchToHttp().getRequest();

    const { appRoute, routeKey } = this.getAppRouteFromContext(ctx);

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

    console.log(paramsResult, headersResult, queryResult, bodyResult);

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
        let result = null;
        try {
          if (routeKey) {
            result = await impl[routeKey]({
              query: queryResult.data,
              params: paramsResult.data,
              body: bodyResult.data,
              headers: headersResult.data,
            });
          } else {
            result = await impl({
              query: queryResult.data,
              params: paramsResult.data,
              body: bodyResult.data,
              headers: headersResult.data,
            });
          }
        } catch (e) {
          if (e instanceof TsRestException) {
            result = {
              status: e.getStatus(),
              body: e.getResponse(),
              error: true,
            };
          } else {
            throw e;
          }
        }

        const responseAfterValidation = isValidationEnabled
          ? validateResponse(appRoute, result)
          : result;

        const responseType = appRoute.responses[result.status];
        if (!result.error && isAppRouteOtherResponse(responseType)) {
          if ('setHeader' in res) {
            res.setHeader('content-type', responseType.contentType);
          } else {
            res.header('content-type', responseType.contentType);
          }
        }

        res.status(responseAfterValidation.status);
        return responseAfterValidation.body;
      })
    );
  }
}

const validateResponse = (
  appRoute: AppRoute,
  response: { status: number; body?: unknown }
) => {
  const { body } = response;

  const responseType = appRoute.responses[response.status];
  const responseSchema = isAppRouteOtherResponse(responseType)
    ? responseType.body
    : responseType;

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
