import { AppRoute, AppRouter, isAppRoute } from './dsl';
import { getAppRoutePathRoute } from './server';

type AppRouteShape<T extends AppRoute> = (
  params: Parameters<T['path']>[0]
) => Promise<T['response']>;

export type NestControllerShapeFromAppRouter<T extends AppRouter> = {
  [K in keyof T]: T[K] extends AppRoute ? AppRouteShape<T[K]> : never;
};

type PathsProxyObj<T extends AppRouter> = {
  [K in keyof T]: T[K] extends { method: string } ? string : never;
};

export const initNestServer = <T extends AppRouter>(router: T) => {
  const pathsProxyObj = {} as PathsProxyObj<T>;

  const paths = new Proxy(pathsProxyObj, {
    get: (_, key) => {
      const appRoute = router[String(key)];

      if (!isAppRoute(appRoute)) {
        throw new Error('[tscont] Invalid route picked');
      }

      return getAppRoutePathRoute(appRoute);
    },
  });

  return {
    controllerShape: {} as NestControllerShapeFromAppRouter<T>,
    paths,
  };
};
