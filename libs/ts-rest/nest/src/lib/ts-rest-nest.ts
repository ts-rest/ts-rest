import {
  AppRoute,
  AppRouter,
  ApiRouteResponse,
  Without,
  getRouteResponses,
  RouteResponse,
} from '@ts-rest/core';
import { ApiDecoratorShape } from './api.decorator';

type AppRouterMethodShape<
  T extends AppRoute,
  ValidateRoute extends boolean = false
> = (
  ...args: any[]
) => Promise<ApiRouteResponse<T['responses'], ValidateRoute>>;

type AppRouterControllerShape<
  T extends AppRouter,
  ValidateRoute extends boolean = false
> = {
  [K in keyof T]: T[K] extends AppRouter
    ? undefined
    : T[K] extends AppRoute
    ? AppRouterMethodShape<T[K], ValidateRoute>
    : never;
};

type AppRouteShape<T extends AppRouter> = {
  [K in keyof T]: T[K] extends AppRouter
    ? AppRouteShape<T[K]>
    : T[K] extends AppRoute
    ? ApiDecoratorShape<T[K]>
    : never;
};

export type NestControllerShapeFromAppRouter<
  T extends AppRouter,
  ValidateRoute extends boolean = false
> = Without<AppRouterControllerShape<T, ValidateRoute>, AppRouter>;

export type NestAppRouteShape<T extends AppRouter> = AppRouteShape<T>;

export type InitServerOptions = {
  parseResponses: boolean;
};

export type InitServerReturn<
  T extends AppRouter,
  ParseResponses extends boolean
> = {
  controllerShape: NestControllerShapeFromAppRouter<T, boolean>;
  routeShapes: AppRouteShape<T>;
  responseShapes: RouteResponse<T, ParseResponses>;
  route: T;
};

export const initNestServer = <
  T extends AppRouter,
  Options extends InitServerOptions
>(
  router: T,
  options?: Options
): Options['parseResponses'] extends true
  ? InitServerReturn<T, true>
  : InitServerReturn<T, false> => {
  const isResponseParsingEnabled = options?.parseResponses ?? false;

  return {
    controllerShape: {} as NestControllerShapeFromAppRouter<
      T,
      typeof isResponseParsingEnabled
    >,
    routeShapes: {} as NestAppRouteShape<T>,
    responseShapes: getRouteResponses(router, isResponseParsingEnabled),
    route: router,
  };
};
