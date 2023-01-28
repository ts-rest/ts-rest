import {
  applyDecorators,
  CallHandler,
  Delete,
  ExecutionContext,
  Get,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  Patch,
  Post,
  Put,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express-serve-static-core';
import { AppRoute, checkZodSchema, HTTPStatusCode } from '@ts-rest/core';
import { tsRestAppRouteMetadataKey } from './ts-rest-request.decorator';
import { ParseResponsesSymbol } from './parse-responses.decorator';

@Injectable()
export class TsRestInterceptor implements NestInterceptor {
  private isAppRouteResponse(
    value: unknown
  ): value is { status: HTTPStatusCode; body?: any } {
    return (
      value != null &&
      typeof value === 'object' &&
      'status' in value &&
      typeof value.status === 'number'
    );
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res: Response = context.switchToHttp().getResponse();

    const appRoute: AppRoute | undefined = Reflect.getMetadata(
      tsRestAppRouteMetadataKey,
      context.getHandler()
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @Api()');
    }

    return next.handle().pipe(
      map((value) => {
        if (this.isAppRouteResponse(value)) {
          const statusNumber = value.status;

          const isParsingEnabled = Boolean(
            Reflect.getMetadata(ParseResponsesSymbol, context.getHandler()) ||
              Reflect.getMetadata(ParseResponsesSymbol, context.getClass())
          );

          const responseValidation = checkZodSchema(
            value.body,
            isParsingEnabled ? appRoute.responses[statusNumber] : undefined
          );

          if (!responseValidation.success) {
            const { error } = responseValidation;

            const message = error.errors.map(
              (error) => `${error.path.join('.')}: ${error.message}`
            );
            throw new InternalServerErrorException(message);
          }

          res.status(statusNumber);
          return responseValidation.data;
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
