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
  getAppRoutePathRoute,
  getPathParamsFromUrl,
  Without,
} from '@ts-rest/core';
import { map, Observable } from 'rxjs';
import { z, ZodTypeAny } from 'zod';

export type ApiDecoratorShape<TRoute extends AppRoute> = Without<
  {
    params: Parameters<TRoute['path']>[0];
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

const isZodObject = (
  body: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): body is z.ZodObject<any, any, any, any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (body as z.ZodObject<any, any, any, any>).safeParse !== undefined;
};

const checkBodySchema = (
  body: unknown,
  appRoute: AppRoute
):
  | {
      success: true;
      body: unknown;
    }
  | {
      success: false;
      error: unknown;
    } => {
  if (appRoute.__tsType === 'AppRouteMutation' && appRoute.body) {
    if (isZodObject(appRoute.body)) {
      const result = appRoute.body.safeParse(body);

      if (result.success) {
        return {
          success: true,
          body: result.data,
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
    body: body,
  };
};

const checkQuerySchema = (
  query: unknown,
  appRoute: AppRoute
):
  | {
      success: true;
      body: unknown;
    }
  | {
      success: false;
      error: unknown;
    } => {
  if (appRoute.query) {
    if (isZodObject(appRoute.query)) {
      const result = appRoute.query.safeParse(query);

      if (result.success) {
        return {
          success: true,
          body: result.data,
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
    body: query,
  };
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
      params: pathParams,
      body: bodyResult.body,
    };
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
