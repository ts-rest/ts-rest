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
} from '@nestjs/common';
import {
  AppRouter,
  isAppRoute,
  AppRoute,
  checkZodSchema,
  parseJsonQueryObject,
  validateResponse,
  zodErrorResponse,
  ServerInferResponses,
} from '@ts-rest/core';
import {
  JsonQuerySymbol,
  TsRestAppRouterMetadataKey,
  ValidateResponsesSymbol,
} from './constants';
import { TsRestRequestShape } from './ts-rest-request.decorator';

export const TsRestHandler = (appRouter: AppRouter): MethodDecorator => {
  const decorators = [];

  const routerPaths: string[] = [];

  Object.entries(appRouter).forEach(([key, value]) => {
    if (isAppRoute(value)) {
      routerPaths.push(value.path);
    }
  });

  decorators.push(
    All(routerPaths),
    SetMetadata(TsRestAppRouterMetadataKey, appRouter),
    UseInterceptors(TsRestHandlerInterceptor)
  );

  return applyDecorators(...decorators);
};

type NestHandlerImplementation<T extends AppRouter> = {
  [K in keyof T]: T[K] extends AppRoute
    ? (args: TsRestRequestShape<T[K]>) => Promise<ServerInferResponses<T[K]>>
    : never;
};

export const tsRestHandler = <T extends AppRouter>(
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

  intercept(ctx: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const res: Response = ctx.switchToHttp().getResponse();
    const req: Request = ctx.switchToHttp().getRequest();

    const appRouter = this.reflector.get<AppRouter | undefined>(
      TsRestAppRouterMetadataKey,
      ctx.getHandler()
    );

    if (!appRouter) {
      throw new Error(
        'Make sure your route is decorated with @TsRestHandler()'
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

    const [appRouteAlias, appRoute] = foundAppRoute;

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

    if (!paramsResult.success) {
      throw new BadRequestException(zodErrorResponse(paramsResult.error));
    }

    const headersResult = checkZodSchema(req.headers, appRoute.headers, {
      passThroughExtraKeys: true,
    });

    if (!headersResult.success) {
      throw new BadRequestException(zodErrorResponse(headersResult.error));
    }

    const query = isJsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, appRoute.query);

    if (!queryResult.success) {
      throw new BadRequestException(zodErrorResponse(queryResult.error));
    }

    const bodyResult = checkZodSchema(
      req.body,
      'body' in appRoute ? appRoute.body : null
    );

    if (!bodyResult.success) {
      throw new BadRequestException(zodErrorResponse(bodyResult.error));
    }

    return next.handle().pipe(
      map(async (impl) => {
        const result = await impl[appRouteAlias]({
          query: queryResult.data,
          params: paramsResult.data,
          body: bodyResult.data,
          headers: headersResult.data,
        });

        const responseAfterValidation = isValidationEnabled
          ? validateResponse({
              responseType: appRoute.responses[result.status],
              response: result.body,
            })
          : result;

        res.status(responseAfterValidation.status);
        return responseAfterValidation.body;
      })
    );
  }
}
