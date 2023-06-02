import {
  AppRoute,
  AppRouter,
  Without,
  ServerInferResponses,
} from '@ts-rest/core';
import { TsRestRequestShape } from './ts-rest-request.decorator';

type AppRouterMethodShape<T extends AppRoute> = (
  ...args: any[]
) => Promise<ServerInferResponses<T>>;

type AppRouterControllerShape<T extends AppRouter> = Without<
  {
    [K in keyof T]: T[K] extends AppRoute ? AppRouterMethodShape<T[K]> : never;
  },
  never
>;

type AppRouterRequestShapes<T extends AppRouter> = Without<
  {
    [K in keyof T]: T[K] extends AppRoute ? TsRestRequestShape<T[K]> : never;
  },
  never
>;

type AppRouterResponseShapes<T extends AppRouter> = Without<
  {
    [K in keyof T]: T[K] extends AppRoute
      ? Promise<ServerInferResponses<T[K]>>
      : never;
  },
  never
>;

/**
 * @deprecated Use `nestControllerContract`, `NestControllerInterface`, `NestRequestShapes`, and `NestResponseShapes` instead
 * @see {@link https://ts-rest.com/docs/nest|ts-rest docs} for more info.
 */
export const initNestServer = <T extends AppRouter>(router: T) => {
  return {
    controllerShape: {} as AppRouterControllerShape<T>,
    routeShapes: {} as AppRouterRequestShapes<T>,
    responseShapes: {} as AppRouterResponseShapes<T>,
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
export type NestRequestShapes<T extends AppRouter> = AppRouterRequestShapes<T>;
export type NestResponseShapes<T extends AppRouter> =
  AppRouterResponseShapes<T>;

/**
 * Returns the contract containing only non-nested routes required by a NestJS controller
 */
export const nestControllerContract = <T extends AppRouter>(router: T) => {
  // it's not worth actually filtering the contract at runtime
  // the typing will already ensure that nested routes cannot be used at compile time
  return router as NestControllerContract<T>;
};
