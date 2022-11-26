import {
  applyDecorators,
  BadRequestException,
  CallHandler,
  createParamDecorator,
  Delete,
  ExecutionContext,
  Get,
  HttpException,
  Injectable,
  NestInterceptor,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import {
  AppRoute,
  AppRouteMutation,
  checkZodSchema,
  getPathParamsFromUrl,
  PathParamsWithCustomValidators,
  Without,
  ZodInferOrType,
} from '@ts-rest/core';
import { map, Observable } from 'rxjs';

type BodyWithoutFileIfMultiPart<T extends AppRouteMutation> =
  T['contentType'] extends 'multipart/form-data'
    ? Without<ZodInferOrType<T['body']>, File>
    : ZodInferOrType<T['body']>;

export type ApiDecoratorShape<TRoute extends AppRoute> = Without<
  {
    params: PathParamsWithCustomValidators<TRoute>;
    body: TRoute extends AppRouteMutation
      ? BodyWithoutFileIfMultiPart<TRoute>
      : never;
    query: ZodInferOrType<TRoute['query']>;
  },
  never
>;

const getQueryParams = (url: string): Record<string, string> => {
  const searchParams = new URLSearchParams(url.split('?')[1]);
  const queryParams: Record<string, string> = {};

  for (const [key, value] of searchParams) {
    queryParams[key] = value;
  }

  return queryParams;
};

export const ApiDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ApiDecoratorShape<any> => {
    const req = ctx.switchToHttp().getRequest();

    const appRoute = req.appRoute as AppRoute | undefined;

    if (!appRoute) {
      throw new BadRequestException(
        'Make sure your route is decorated with @Api()'
      );
    }

    const pathParams = getPathParamsFromUrl(req.url, appRoute);
    const queryParams = getQueryParams(req.url);

    const queryResult = checkZodSchema(queryParams, appRoute.query);

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

    const pathParamsResult = checkZodSchema(pathParams, appRoute.pathParams, {
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

@Injectable()
export class ApiRouteInterceptor implements NestInterceptor {
  constructor(private readonly appRoute: AppRoute) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    req.appRoute = this.appRoute;

    return next.handle().pipe(
      map((value) => {
        if (
          typeof value === 'object' &&
          typeof value.status === 'number' &&
          value.body !== undefined
        ) {
          throw new HttpException(value?.body, value.status);
        }

        return value;
      })
    );
  }
}

export const Api = (appRoute: AppRoute): MethodDecorator => {
  const methodDecorator = getMethodDecorator(appRoute);

  return applyDecorators(
    methodDecorator,
    // Apply the interceptor to populate req.appRoute
    UseInterceptors(new ApiRouteInterceptor(appRoute))
  );
};
