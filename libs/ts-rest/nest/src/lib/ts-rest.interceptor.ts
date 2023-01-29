import {
  applyDecorators,
  CallHandler,
  Delete,
  ExecutionContext,
  Get,
  Injectable,
  NestInterceptor,
  Patch,
  Post,
  Put,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express-serve-static-core';
import { AppRoute, isAppRouteResponse, validateResponse } from '@ts-rest/core';
import { tsRestAppRouteMetadataKey } from './ts-rest-request.decorator';
import { Reflector } from '@nestjs/core';
import { ValidateResponsesSymbol } from './ts-rest.decorator';

@Injectable()
export class TsRestInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res: Response = context.switchToHttp().getResponse();

    const appRoute = this.reflector.get<AppRoute | undefined>(
      tsRestAppRouteMetadataKey,
      context.getHandler()
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @Api()');
    }

    const isValidationEnabled = Boolean(
      this.reflector.getAllAndOverride<boolean | undefined>(
        ValidateResponsesSymbol,
        [context.getHandler(), context.getClass()]
      )
    );

    return next.handle().pipe(
      map((value) => {
        if (isAppRouteResponse(value)) {
          const response = isValidationEnabled
            ? validateResponse({
                responseType: appRoute.responses[value.status],
                response: value,
              })
            : value;

          res.status(response.status);
          return response.body;
        }

        return value;
      })
    );
  }
}

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
 * Method decorator used to register a route's path and method from the passed route and handle ts-rest response objects
 * @param appRoute The route to register
 */
export const Api = (appRoute: AppRoute): MethodDecorator => {
  const methodDecorator = getMethodDecorator(appRoute);

  return applyDecorators(
    SetMetadata(tsRestAppRouteMetadataKey, appRoute),
    methodDecorator,
    UseInterceptors(TsRestInterceptor)
  );
};
