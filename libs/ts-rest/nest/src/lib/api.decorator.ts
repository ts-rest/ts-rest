import {
  applyDecorators,
  BadRequestException,
  CallHandler,
  createParamDecorator,
  Delete,
  ExecutionContext,
  Get,
  Injectable,
  Logger,
  NestInterceptor,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import {
  AppRoute,
  AppRouteMutation,
  getAppRoutePathRoute,
  Without,
} from '@ts-rest/core';
import { Observable, tap } from 'rxjs';
import { z } from 'zod';

export type ApiDecoratorShape<TRoute extends AppRoute> = Without<
  {
    params: Parameters<TRoute['path']>[0];
    body: TRoute extends AppRouteMutation
      ? TRoute['body'] extends z.AnyZodObject
        ? z.infer<TRoute['body']>
        : TRoute['body']
      : never;
    query: TRoute['query'] extends z.AnyZodObject
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

const getPathParams = (
  url: string,
  appRoute: AppRoute
): Record<string, string> => {
  const baseUrl = url.split('?')[0];

  const paths = getAppRoutePathRoute(appRoute);

  const baseUrlAsArr = baseUrl.split('/');
  const pathAsArr = paths.split('/');

  const pathParams: Record<string, string> = {};

  baseUrlAsArr.forEach((baseUrlPart, index) => {
    pathParams[pathAsArr[index]] = baseUrlPart;
  });

  // remove pathParams where key doesn't start with :
  const pathParamsWithoutColons = Object.entries(pathParams).reduce(
    (acc, [key, value]) => {
      if (key.startsWith(':')) {
        const keyWithoutColon = key.slice(1);
        acc[keyWithoutColon] = value;
      }

      return acc;
    },
    {} as Record<string, string>
  );

  return pathParamsWithoutColons;
};

const isZodObject = (
  body: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): body is z.ZodObject<any, any, any, any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (body as z.ZodObject<any, any, any, any>).parse !== undefined;
};

const checkBodySchema = (
  body: unknown,
  appRoute: AppRoute
):
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      error: unknown;
    } => {
  if (appRoute.__type === 'AppRouteMutation') {
    if (isZodObject(appRoute.body)) {
      const result = appRoute.body.safeParse(body);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      }

      return {
        success: false,
        error: result.error,
      };
    }
  }

  return {
    success: true,
    data: body,
  };
};

export const ApiDecorator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    const appRoute = req.appRoute as AppRoute | undefined;

    if (!appRoute) {
      throw new BadRequestException(
        'Make sure your route is decorated with @Api()'
      );
    }

    const pathParams = getPathParams(req.url, appRoute);
    const queryParams = getQueryParams(req.url);

    const bodyResult = checkBodySchema(req.body, appRoute);

    if (bodyResult.success === false) {
      throw new BadRequestException(bodyResult.error);
    }

    return { query: queryParams, params: pathParams, body: bodyResult.data };
  }
);

const getMethodDecorator = (appRoute: AppRoute) => {
  const path = getAppRoutePathRoute(appRoute);

  switch (appRoute.method) {
    case 'DELETE':
      return Delete(path);
    case 'GET':
      return Get(path);
    case 'POST':
      return Post(path);
    case 'PATCH':
      return Patch(path);
    case 'PUT':
      return Put(path);
  }
};

@Injectable()
export class ApiRouteInterceptor implements NestInterceptor {
  constructor(private readonly appRoute: AppRoute) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    req.appRoute = this.appRoute;

    return next.handle();
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
