import {
  AppRoute,
  AppRouter,
  isAppRoute,
  ServerInferResponses,
} from '@ts-rest/core';
import { TsRestRequest, TsRestRequestShape } from './ts-rest-request.decorator';
import { TsRest } from './ts-rest.decorator';
import { TsRestOptions } from './ts-rest-options';
import { NestControllerInterface } from './ts-rest-nest';

export type NestHandler<T extends AppRoute, C> = (
  this: C,
  request: TsRestRequestShape<T>,
  ...args: any[]
) => Promise<ServerInferResponses<T>>;

type NestMethodDefinition<T extends AppRoute, C> = {
  handler: NestHandler<T, C>;
  md?: MethodDecorator[];
  pd?: ParameterDecorator[];
} & TsRestOptions;

type NestRoutes<T extends AppRouter, C> = {
  [K in keyof T]: T[K] extends AppRoute
    ? NestHandler<T[K], C> | NestMethodDefinition<T[K], C>
    : never;
};

interface TsRestControllerClass<T extends AppRouter> {
  new (): Omit<NestControllerInterface<T>, 'handler'>;
  copyDecorators(): void;
}

export type TsrController<T extends AppRouter> = Omit<
  NestControllerInterface<T>,
  'handler'
>;

export const TsRestController =
  <C>() =>
  <T extends AppRouter>(contract: T, routes: NestRoutes<T, C>) => {
    const tsRestController = class {} as TsRestControllerClass<T>;

    for (const key in routes) {
      const methodDefinition = routes[key] as unknown as
        | NestHandler<AppRoute, C>
        | NestMethodDefinition<AppRoute, C>;

      let handler: NestHandler<AppRoute, C>;
      let pd: ParameterDecorator[] = [];
      let md: MethodDecorator[] = [];
      let tsRestOptions: TsRestOptions = {};

      if (typeof methodDefinition === 'function') {
        handler = methodDefinition;
      } else {
        ({ handler, md = [], pd = [], ...tsRestOptions } = methodDefinition);
      }

      pd.unshift(TsRestRequest());
      md.unshift(TsRest(contract[key] as AppRoute, tsRestOptions));

      md.reverse();

      Object.defineProperty(tsRestController.prototype, key, {
        value: handler,
        writable: true,
        configurable: true,
      });

      for (const [idx, paramDecorator] of pd.entries()) {
        paramDecorator(tsRestController.prototype, key, idx);
      }

      for (const methodDecorator of md) {
        methodDecorator(
          tsRestController.prototype,
          key,
          Object.getOwnPropertyDescriptor(tsRestController.prototype, key)!,
        );
      }
    }

    return tsRestController;
  };

export const initializeTsRestRoutes = <T extends AppRouter>(
  controllerClass: TsRestControllerClass<T>,
  contract: T,
) => {
  for (const key in contract) {
    const appRoute = contract[key];

    if (isAppRoute(appRoute)) {
      TsRestRequest()(controllerClass.prototype, key, 0);
      TsRest(contract[key] as AppRoute)(
        controllerClass.prototype,
        key,
        Object.getOwnPropertyDescriptor(controllerClass.prototype, key)!,
      );
    }
  }
};
