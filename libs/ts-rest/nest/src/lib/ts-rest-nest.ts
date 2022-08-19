import {
  AppRoute,
  AppRouter,
  AppRouterResponseWithStatusCodeSupport,
  Without,
} from '@ts-rest/core';
import { ApiDecoratorShape } from './api.decorator';

type AppRouterMethodShape<T extends AppRoute> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<AppRouterResponseWithStatusCodeSupport<T['response']>>;

type AppRouterControllerShape<T extends AppRouter> = {
  [K in keyof T]: T[K] extends AppRouter
    ? undefined
    : T[K] extends AppRoute
    ? AppRouterMethodShape<T[K]>
    : never;
};

type AppRouteShape<T extends AppRouter> = {
  [K in keyof T]: T[K] extends AppRouter
    ? AppRouteShape<T[K]>
    : T[K] extends AppRoute
    ? ApiDecoratorShape<T[K]>
    : never;
};

export type NestControllerShapeFromAppRouter<T extends AppRouter> = Without<
  AppRouterControllerShape<T>,
  AppRouter
>;

export type NestAppRouteShape<T extends AppRouter> = AppRouteShape<T>;

export const initNestServer = <T extends AppRouter>(router: T) => {
  return {
    controllerShape: {} as NestControllerShapeFromAppRouter<T>,
    routeShapes: {} as NestAppRouteShape<T>,
    route: router,
  };
};
