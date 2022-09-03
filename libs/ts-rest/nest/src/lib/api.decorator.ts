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
  checkBodySchema,
  checkQuerySchema,
  getPathParamsFromUrl,
  PathParams,
  Without,
} from '@ts-rest/core';
import { map, Observable } from 'rxjs';
import { z, ZodTypeAny } from 'zod';

export type ApiDecoratorShape<TRoute extends AppRoute> = Without<
  {
    params: PathParams<TRoute>;
    body: TRoute extends AppRouteMutation
      ? TRoute['body'] extends ZodTypeAny
        ? z.infer<TRoute['body']>
        : TRoute['body']
      : never;
    query: TRoute['query'] extends ZodTypeAny
      ? z.infer<TRoute['query']>
      : TRoute['query'];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const queryResult = checkQuerySchema(queryParams, appRoute);

    if (queryResult.success === false) {
      throw new BadRequestException(queryResult.error);
    }

    const bodyResult = checkBodySchema(req.body, appRoute);

    if (bodyResult.success === false) {
      throw new BadRequestException(bodyResult.error);
    }

    return {
      query: queryResult.body,
      // @ts-expect-error because the decorator shape is any
      params: pathParams,
      body: bodyResult.body,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
