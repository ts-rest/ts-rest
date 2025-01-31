import { AppRoute, AppRouter } from '@ts-rest/core';
import { RequestHandler } from 'itty-router';
import { TsRestRequest } from '../request';
import {
  AppRouteImplementation,
  AppRouteImplementationOrOptions,
  RouterImplementation,
} from '../types';
import {
  ChooseContractRoute,
  ChooseContractSubContract,
  ContractEndpointPaths,
  EndpointPathsToSubcontractPaths,
  PartialRouter,
  PartialRouterPaths,
} from './types';
import { TsRestResponse } from '../response';

export class RouterBuilder<
  TContract extends AppRouter,
  TPlatformContext,
  TRequestExtensionCumulative,
  TRemainingRoutes extends
    ContractEndpointPaths<TContract> = ContractEndpointPaths<TContract>,
> {
  protected _requestMiddleware: Array<
    RequestHandler<
      TsRestRequest & TRequestExtensionCumulative,
      [TPlatformContext]
    >
  >;

  protected _responseHandlers: Array<
    (
      response: TsRestResponse,
      request: TsRestRequest & TRequestExtensionCumulative,
      args: TPlatformContext,
    ) => TsRestResponse | Promise<TsRestResponse> | void | Promise<void>
  >;

  protected _router: PartialRouter<
    TContract,
    TPlatformContext,
    TRequestExtensionCumulative
  >;

  private _remainingRoutes: Set<TRemainingRoutes>;

  private contract: TContract;

  constructor(
    contractOrBuilder:
      | TContract
      | RouterBuilder<
          TContract,
          TPlatformContext,
          TRequestExtensionCumulative,
          TRemainingRoutes
        >,
  ) {
    if (contractOrBuilder instanceof RouterBuilder) {
      this.contract = contractOrBuilder.contract;
      this._requestMiddleware = [...contractOrBuilder._requestMiddleware];
      this._responseHandlers = [...contractOrBuilder._responseHandlers];
      this._router = Object.assign({}, contractOrBuilder._router);
      this._remainingRoutes = new Set(contractOrBuilder._remainingRoutes);
    } else {
      this.contract = contractOrBuilder;
      this._requestMiddleware = [];
      this._responseHandlers = [];
      this._router = {};
      this._remainingRoutes = new Set(
        this.getPathsFromContractOrRouter(
          contractOrBuilder,
        ) as TRemainingRoutes[],
      );
    }
  }

  clone() {
    return new RouterBuilder<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative,
      TRemainingRoutes
    >(this);
  }

  private isRouteImplementationOrOptions(
    obj:
      | PartialRouter<TContract, TPlatformContext, TRequestExtensionCumulative>
      | AppRouteImplementationOrOptions<
          AppRoute,
          TPlatformContext,
          TRequestExtensionCumulative
        >,
  ): obj is AppRouteImplementationOrOptions<
    AppRoute,
    TPlatformContext,
    TRequestExtensionCumulative
  > {
    return (
      typeof obj === 'function' ||
      ('handler' in obj && typeof obj.handler === 'function')
    );
  }

  private isContractEndpointOrRouteImplementationOrOptions(
    obj:
      | AppRoute
      | PartialRouter<TContract, TPlatformContext, TRequestExtensionCumulative>
      | AppRouteImplementationOrOptions<
          AppRoute,
          TPlatformContext,
          TRequestExtensionCumulative
        >,
  ): obj is
    | AppRoute
    | AppRouteImplementationOrOptions<
        AppRoute,
        TPlatformContext,
        TRequestExtensionCumulative
      > {
    return (
      ('method' in obj && 'path' in obj) ||
      this.isRouteImplementationOrOptions(obj)
    );
  }

  private getPathsFromContractOrRouter(
    contractOrRouter:
      | AppRouter
      | PartialRouter<TContract, TPlatformContext, TRequestExtensionCumulative>,
    parentPath = '',
  ) {
    const keyPrefix = parentPath === '' ? '' : `${parentPath}.`;

    return Object.entries(contractOrRouter).reduce((acc, [key, value]) => {
      if (this.isContractEndpointOrRouteImplementationOrOptions(value)) {
        acc.push(`${keyPrefix}${key}`);
      } else {
        acc.push(
          ...this.getPathsFromContractOrRouter(
            contractOrRouter[key] as any,
            `${keyPrefix}${key}`,
          ),
        );
      }

      return acc;
    }, [] as string[]);
  }

  requestMiddleware<
    TRequestExtension,
    TMiddleware extends RequestHandler<
      TsRestRequest & TRequestExtensionCumulative & TRequestExtension,
      [TPlatformContext]
    > = RequestHandler<
      TsRestRequest & TRequestExtensionCumulative & TRequestExtension,
      [TPlatformContext]
    >,
  >(middleware: TMiddleware) {
    this._requestMiddleware.push(middleware as any);

    return this as RouterBuilder<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative & TRequestExtension
    >;
  }

  responseHandler(
    handler: (
      response: TsRestResponse,
      request: TsRestRequest & TRequestExtensionCumulative,
      args: TPlatformContext,
    ) => TsRestResponse | Promise<TsRestResponse> | void | Promise<void>,
  ) {
    this._responseHandlers.push(handler);
    return this;
  }

  route<
    TRouteName extends TRemainingRoutes,
    TRouteImplementation extends AppRouteImplementation<
      TEndpoint,
      TPlatformContext,
      TRequestExtensionCumulative
    >,
    TEndpoint extends AppRoute = ChooseContractRoute<TContract, TRouteName>,
    TNewRemainingRoutes extends Exclude<TRemainingRoutes, TRouteName> = Exclude<
      TRemainingRoutes,
      TRouteName
    >,
  >(
    routeName: TRouteName,
    route: TRouteImplementation,
  ): [TNewRemainingRoutes] extends [never]
    ? CompleteRouter<TContract, TPlatformContext, TRequestExtensionCumulative>
    : RouterBuilder<
        TContract,
        TPlatformContext,
        TRequestExtensionCumulative,
        TNewRemainingRoutes
      > {
    const paths = routeName.split('.');
    let routeParent: any = this._router;

    while (paths.length > 1) {
      const path = paths.shift()!;
      if (!routeParent[path]) {
        routeParent[path] = {};
      }
      routeParent = routeParent[path] as any;
    }

    routeParent[paths.shift()!] = route;

    this._remainingRoutes.delete(routeName);

    if (this._remainingRoutes.size > 0) {
      // @ts-expect-error - assert that _remainingRoutes.size > 0 means TNewRemainingRoutes is not `never`
      return this as unknown as RouterBuilder<
        TContract,
        TPlatformContext,
        TRequestExtensionCumulative,
        TNewRemainingRoutes
      >;
    }

    return new CompleteRouter<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    >(this);
  }

  routeWithMiddleware<
    TRouteName extends TRemainingRoutes,
    TEndpoint extends AppRoute = ChooseContractRoute<TContract, TRouteName>,
  >(
    routeName: TRouteName,
    route: (
      routeBuilder: RouteBuilder<
        TPlatformContext,
        TRequestExtensionCumulative,
        TEndpoint
      >,
    ) => AppRouteImplementationOrOptions<TEndpoint, TPlatformContext, any>,
  ) {
    return this.route(
      routeName,
      route(
        new RouteBuilder<
          TPlatformContext,
          TRequestExtensionCumulative,
          TEndpoint
        >(),
      ) as any,
    );
  }

  partialRouter<
    TPartialRouter extends PartialRouter<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    >,
    TNewRemainingRoutes extends Exclude<
      TRemainingRoutes,
      PartialRouterPaths<TContract, TPartialRouter>
    > = Exclude<
      TRemainingRoutes,
      PartialRouterPaths<TContract, TPartialRouter>
    >,
  >(
    partialRouter: TPartialRouter,
  ): [TNewRemainingRoutes] extends [never]
    ? CompleteRouter<TContract, TPlatformContext, TRequestExtensionCumulative>
    : RouterBuilder<
        TContract,
        TPlatformContext,
        TRequestExtensionCumulative,
        TNewRemainingRoutes
      > {
    this.getPathsFromContractOrRouter(partialRouter).forEach((path) => {
      this._remainingRoutes.delete(path as TRemainingRoutes);
    });

    const mergePartialRouter = (
      targetRouter: any,
      subRouter: any,
      parentPath = '',
    ) => {
      const keyPrefix = parentPath === '' ? '' : `${parentPath}.`;

      return Object.entries(subRouter).forEach(([key, value]) => {
        if (this.isRouteImplementationOrOptions(value as any)) {
          this._remainingRoutes.delete(
            `${keyPrefix}.${key}` as TRemainingRoutes,
          );

          targetRouter[key] = value;
        } else {
          if (!targetRouter[key]) {
            targetRouter[key] = {};
          }

          mergePartialRouter(targetRouter[key], value, `${keyPrefix}.${key}`);
        }
      });
    };

    mergePartialRouter(this._router, partialRouter);

    if (this._remainingRoutes.size > 0) {
      // @ts-expect-error - assert that _remainingRoutes.size > 0 means TNewRemainingRoutes is not `never`
      return this as unknown as RouterBuilder<
        TContract,
        TPlatformContext,
        TRequestExtensionCumulative,
        TNewRemainingRoutes
      >;
    }

    return new CompleteRouter<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    >(this);
  }

  subRouter<
    TSubRouterPath extends EndpointPathsToSubcontractPaths<
      TContract,
      TRemainingRoutes
    >,
    TSubContract extends ChooseContractSubContract<TContract, TSubRouterPath>,
    TSubRouterImplementation extends
      | RouterImplementation<
          TSubContract,
          TPlatformContext,
          TRequestExtensionCumulative
        >
      | CompleteRouter<TSubContract, TPlatformContext, any>,
    TSubRouterPaths = `${TSubRouterPath}.${ContractEndpointPaths<TSubContract>}`,
    TNewRemainingRoutes extends Exclude<
      TRemainingRoutes,
      TSubRouterPaths
    > = Exclude<TRemainingRoutes, TSubRouterPaths>,
  >(
    subRouterPath: TSubRouterPath,
    subRouter: TSubRouterImplementation,
  ): [TNewRemainingRoutes] extends [never]
    ? CompleteRouter<TContract, TPlatformContext, TRequestExtensionCumulative>
    : RouterBuilder<
        TContract,
        TPlatformContext,
        TRequestExtensionCumulative,
        TNewRemainingRoutes
      > {
    const pathParts = subRouterPath.split('.');
    const partialRouter: PartialRouter<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    > = {};
    let routerParent: any = partialRouter;

    while (pathParts.length > 1) {
      const path = pathParts.shift()!;
      routerParent[path] = {};
      routerParent = routerParent[path];
    }

    routerParent[pathParts.shift()!] =
      subRouter instanceof CompleteRouter ? subRouter.build() : subRouter;

    return this.partialRouter(partialRouter) as any;
  }

  fullRouter<
    TRouter extends RouterImplementation<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    > = RouterImplementation<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    >,
  >(router: TRouter) {
    this._router = router;
    this._remainingRoutes.clear();

    // full router passed, convert to Router
    return new CompleteRouter<
      TContract,
      TPlatformContext,
      TRequestExtensionCumulative
    >(this);
  }
}

export class CompleteRouter<
  TContract extends AppRouter,
  TPlatformContext,
  TRequestExtension,
> extends RouterBuilder<TContract, TPlatformContext, TRequestExtension, never> {
  constructor(
    builder: RouterBuilder<TContract, TPlatformContext, TRequestExtension>,
  ) {
    super(
      builder as RouterBuilder<
        TContract,
        TPlatformContext,
        TRequestExtension,
        never
      >,
    );
  }

  public getRequestMiddleware() {
    return this._requestMiddleware;
  }

  public getResponseHandlers() {
    return this._responseHandlers;
  }

  build() {
    return this._router as RouterImplementation<
      TContract,
      TPlatformContext,
      TRequestExtension
    >;
  }
}

class RouteBuilder<
  TPlatformContext,
  TRequestExtensionCumulative,
  TEndpoint extends AppRoute,
> {
  private _middleware: Array<
    RequestHandler<
      TsRestRequest & TRequestExtensionCumulative,
      [TPlatformContext]
    >
  > = [];

  constructor() {}

  middleware<
    TRequestExtension,
    TMiddleware extends RequestHandler<
      TsRestRequest & TRequestExtensionCumulative & TRequestExtension,
      [TPlatformContext]
    > = RequestHandler<
      TsRestRequest & TRequestExtensionCumulative & TRequestExtension,
      [TPlatformContext]
    >,
  >(middleware: TMiddleware) {
    this._middleware.push(middleware as any);

    return this as RouteBuilder<
      TPlatformContext,
      TRequestExtensionCumulative & TRequestExtension,
      TEndpoint
    >;
  }

  handler(
    handler: AppRouteImplementation<
      TEndpoint,
      TPlatformContext,
      TRequestExtensionCumulative
    >,
  ): AppRouteImplementationOrOptions<
    TEndpoint,
    TPlatformContext,
    TRequestExtensionCumulative
  > {
    return {
      middleware: this._middleware,
      handler,
    };
  }
}
