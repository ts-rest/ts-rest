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
import { AppRoute } from '@ts-rest/core';
import { tsRestAppRouteMetadataKey } from './ts-rest-request.decorator';

@Injectable()
export class TsRestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((value) => {
        if (
          typeof value === 'object' &&
          typeof value.status === 'number' &&
          value.body !== undefined
        ) {
          res.status(value.status);
          return value.body;
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

export const Api = (appRoute: AppRoute): MethodDecorator => {
  const methodDecorator = getMethodDecorator(appRoute);

  return applyDecorators(
    SetMetadata(tsRestAppRouteMetadataKey, appRoute),
    methodDecorator,
    UseInterceptors(TsRestInterceptor)
  );
};
