import { AppRoute, AppRouter } from '@ts-rest/core';
import { AppRouteImplementationOrOptions } from '../types';

export type PartialRouter<
  T extends AppRouter,
  TPlatformArgs,
  TRequestExtension,
> = {
  [TKey in keyof T]?: T[TKey] extends AppRouter
    ? PartialRouter<T[TKey], TPlatformArgs, TRequestExtension>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey], TPlatformArgs, TRequestExtension>
    : never;
};

export type ContractEndpointPaths<
  T extends AppRouter,
  TKey = keyof T,
> = TKey extends string
  ? T[TKey] extends AppRouter
    ? `${TKey}.${ContractEndpointPaths<T[TKey]>}`
    : T[TKey] extends AppRoute
    ? TKey
    : never
  : never;

export type ContractSubContractPaths<
  T extends AppRouter,
  TKey = keyof T,
> = TKey extends string
  ? T[TKey] extends AppRouter
    ? TKey | `${TKey}.${ContractSubContractPaths<T[TKey]>}`
    : T[TKey] extends AppRoute
    ? never
    : never
  : never;

export type EndpointPathsToSubcontractPaths<
  T extends AppRouter,
  K extends ContractEndpointPaths<T>,
> = K extends `${infer U}.${infer Rest}`
  ?
      | U
      | (T[U] extends AppRouter
          ? Rest extends ContractEndpointPaths<T[U]>
            ? `${U}.${EndpointPathsToSubcontractPaths<T[U], Rest>}`
            : never
          : never)
  : never;

export type PartialRouterPaths<
  TContract extends AppRouter,
  TRouter extends PartialRouter<TContract, any, any>,
  TKey = keyof TContract & keyof TRouter,
> = TKey extends string
  ? TContract[TKey] extends AppRouter
    ? TRouter[TKey] extends PartialRouter<TContract[TKey], any, any>
      ? `${TKey}.${PartialRouterPaths<TContract[TKey], TRouter[TKey]>}`
      : never
    : TContract[TKey] extends AppRoute
    ? [undefined] extends TRouter[TKey]
      ? never
      : TKey
    : never
  : never;

export type ChooseContractRoute<
  T extends AppRouter,
  K extends string,
> = K extends `${infer U}.${infer Rest}`
  ? T[U] extends AppRouter
    ? ChooseContractRoute<T[U], Rest>
    : never
  : T[K] extends AppRoute
  ? T[K]
  : never;

export type ChooseContractSubContract<
  T extends AppRouter,
  K extends string,
> = K extends `${infer U}.${infer Rest}`
  ? T[U] extends AppRouter
    ? Rest extends ContractSubContractPaths<T[U]>
      ? ChooseContractSubContract<T[U], Rest>
      : never
    : never
  : K extends keyof T
  ? T[K] extends AppRouter
    ? T[K]
    : never
  : never;
