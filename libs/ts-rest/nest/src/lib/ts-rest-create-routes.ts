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

export interface NestHandler<T extends AppRoute, C> {
  (
    this: C,
    request: TsRestRequestShape<T>,
    ...args: any[]
  ): Promise<ServerInferResponses<T>>;
}

type NestRoutes<T extends AppRouter, C> = {
  [K in keyof T]: T[K] extends AppRoute ? NestHandler<T[K], C> : never;
};

type TsrControllerInterface<T extends AppRouter, C> = {
  [K in keyof T]: T[K] extends AppRoute ? NestHandler<T[K], C> : never;
};

interface TsRestControllerClass<T extends AppRouter, C> {
  new (): TsrControllerInterface<T, C>;
}

export class TsrController<T extends AppRouter> {
  tsr!: {
    [K in keyof T]: T[K] extends AppRoute ? TsRestRequestShape<T[K]> : never;
  };
}

export const TsRestController =
  <C>() =>
  <T extends AppRouter>(contract: T, routes: NestRoutes<T, C>) => {
    const tsRestController = class {
      constructor() {
        const proto = Object.getPrototypeOf(this);

        if (Reflect.getMetadata('__metadataCopied__', proto)) {
          return;
        }

        for (const key in routes) {
          if (Object.prototype.hasOwnProperty.call(proto, `_${key}`)) {
            const methodMetadataKeys = Reflect.getMetadataKeys(
              proto[`_${key}`],
            );

            for (const methodMetadataKey of methodMetadataKeys) {
              const methodMetadata = Reflect.getMetadata(
                methodMetadataKey,
                proto[`_${key}`],
              );

              if (Array.isArray(methodMetadata)) {
                const originalArrayMetadata = Reflect.getMetadata(
                  methodMetadataKey,
                  proto[key],
                );

                Reflect.defineMetadata(
                  methodMetadataKey,
                  originalArrayMetadata
                    ? [...methodMetadata, ...originalArrayMetadata]
                    : methodMetadata,
                  proto[key],
                );
              } else {
                Reflect.defineMetadata(
                  methodMetadataKey,
                  methodMetadata,
                  proto[key],
                );
              }
            }

            const routeArgumentMetadata = Reflect.getMetadata(
              '__routeArguments__',
              proto['constructor'],
              `_${key}`,
            );

            if (routeArgumentMetadata) {
              const originalRouteArgumentMetadata = Reflect.getMetadata(
                '__routeArguments__',
                proto['constructor'],
                key,
              );

              Reflect.defineMetadata(
                '__routeArguments__',
                {
                  ...originalRouteArgumentMetadata,
                  ...Object.fromEntries(
                    Object.entries(routeArgumentMetadata).map(
                      ([k, v]: [string, any]) => [
                        k,
                        {
                          ...v,
                          index: v.index + 1,
                        },
                      ],
                    ),
                  ),
                },
                proto['constructor'],
                key,
              );
            }
          }
        }

        Reflect.defineMetadata('__metadataCopied__', true, proto);
      }
    } as TsRestControllerClass<T, C>;

    for (const key in routes) {
      const methodDefinition = routes[key] as unknown as NestHandler<
        AppRoute,
        C
      >;

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
  controllerClass: TsRestControllerClass<T, {}>,
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
