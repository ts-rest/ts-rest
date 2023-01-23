import {
  AppRoute,
  AppRouter,
  ApiRouteResponse,
  Without,
  getRouteResponses,
  ApiResponseForRoute,
} from '@ts-rest/core';
import { TypedRequestShape } from './typed-request.decorator';

type AppRouterMethodShape<T extends AppRoute> = (
  ...args: any[]
) => Promise<ApiRouteResponse<T['responses']>>;

type AppRouterControllerShape<T extends AppRouter> = Without<
  {
    [K in keyof T]: T[K] extends AppRoute ? AppRouterMethodShape<T[K]> : never;
  },
  never
>;

type AppRouterRequestShapes<T extends AppRouter> = Without<
  {
    [K in keyof T]: T[K] extends AppRoute ? TypedRequestShape<T[K]> : never;
  },
  never
>;

type AppRouterResponseShapes<T extends AppRouter> = Without<
  {
    [K in keyof T]: T[K] extends AppRoute ? ApiResponseForRoute<T[K]> : never;
  },
  never
>;

type NestControllerShapeFromAppRouter<T extends AppRouter> = Without<
  AppRouterControllerShape<T>,
  AppRouter
>;

type NestAppRouteShape<T extends AppRouter> = AppRouterRequestShapes<T>;

/**
 * @deprecated Use `nestControllerContract`, `NestControllerInterface`, `NestRequestShapes`, and `NestResponseShapes` instead. Check the docs for more info.
 */
export const initNestServer = <T extends AppRouter>(router: T) => {
  return {
    controllerShape: {} as NestControllerShapeFromAppRouter<T>,
    routeShapes: {} as NestAppRouteShape<T>,
    responseShapes: getRouteResponses(router),
    route: router,
  };
};

export type NestControllerContract<T extends AppRouter> = Pick<
  T,
  {
    [K in keyof T]-?: T[K] extends AppRoute ? K : never;
  }[keyof T]
>;
export type NestControllerInterface<T extends AppRouter> =
  AppRouterControllerShape<T>;
export type NestRequestShapes<T extends AppRouter> = NestAppRouteShape<T>;
export type NestResponseShapes<T extends AppRouter> =
  AppRouterResponseShapes<T>;

export const nestControllerContract = <T extends AppRouter>(router: T) => {
  // it's not worth actually filtering the contract at runtime
  // the typing will already ensure that nested routes cannot be used at compile time
  return router as NestControllerContract<T>;
};
