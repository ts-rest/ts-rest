---
id: "ts_rest_nest"
title: "Module: @ts-rest/nest"
sidebar_label: "@ts-rest/nest"
sidebar_position: 0
custom_edit_url: null
---

## Classes

- [TsRestInterceptor](../classes/ts_rest_nest.TsRestInterceptor.md)

## Type Aliases

### NestControllerContract

Ƭ **NestControllerContract**<`T`\>: `Pick`<`T`, { [K in keyof T]-?: T[K] extends AppRoute ? K : never }[keyof `T`]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:56](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L56)

___

### NestControllerInterface

Ƭ **NestControllerInterface**<`T`\>: `AppRouterControllerShape`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:62](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L62)

___

### NestRequestShapes

Ƭ **NestRequestShapes**<`T`\>: `NestAppRouteShape`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:64](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L64)

___

### NestResponseShapes

Ƭ **NestResponseShapes**<`T`\>: `AppRouterResponseShapes`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:65](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L65)

___

### TsRestRequestShape

Ƭ **TsRestRequestShape**<`TRoute`\>: `Without`<{ `body`: `TRoute` extends `AppRouteMutation` ? `BodyWithoutFileIfMultiPart`<`TRoute`\> : `never` ; `params`: `PathParamsWithCustomValidators`<`TRoute`\> ; `query`: `ZodInferOrType`<`TRoute`[``"query"``]\>  }, `never`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRoute` | extends `AppRoute` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-request.decorator.ts:25](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-request.decorator.ts#L25)

## Variables

### JsonQuerySymbol

• `Const` **JsonQuerySymbol**: typeof [`JsonQuerySymbol`](ts_rest_nest.md#jsonquerysymbol)

#### Defined in

[libs/ts-rest/nest/src/lib/json-query.decorator.ts:1](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/json-query.decorator.ts#L1)

___

### tsRestAppRouteMetadataKey

• `Const` **tsRestAppRouteMetadataKey**: typeof [`tsRestAppRouteMetadataKey`](ts_rest_nest.md#tsrestapproutemetadatakey)

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-request.decorator.ts:18](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-request.decorator.ts#L18)

## Functions

### Api

▸ **Api**(`appRoute`): `MethodDecorator`

Method decorator used to register a route's path and method from the passed route and handle ts-rest response objects

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `appRoute` | `AppRoute` | The route to register |

#### Returns

`MethodDecorator`

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest.interceptor.ts:61](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest.interceptor.ts#L61)

___

### ApiDecorator

▸ **ApiDecorator**(`...dataOrPipes`): `ParameterDecorator`

**`Deprecated`**

Use `TsRestRequest` instead

#### Parameters

| Name | Type |
| :------ | :------ |
| `...dataOrPipes` | `unknown`[] |

#### Returns

`ParameterDecorator`

#### Defined in

node_modules/.pnpm/@nestjs+common@9.0.11_j5hagqx4mwzscud4kyjdvubauy/node_modules/@nestjs/common/decorators/http/create-route-param-metadata.decorator.d.ts:10

___

### JsonQuery

▸ **JsonQuery**(`jsonQuery?`): `ClassDecorator` & `MethodDecorator`

Enable JSON query mode for a controller or a single route

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `jsonQuery` | `boolean` | `true` |

#### Returns

`ClassDecorator` & `MethodDecorator`

#### Defined in

[libs/ts-rest/nest/src/lib/json-query.decorator.ts:6](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/json-query.decorator.ts#L6)

___

### TsRestRequest

▸ **TsRestRequest**(`...dataOrPipes`): `ParameterDecorator`

Parameter decorator used to parse, validate and return the typed request object

#### Parameters

| Name | Type |
| :------ | :------ |
| `...dataOrPipes` | `unknown`[] |

#### Returns

`ParameterDecorator`

#### Defined in

node_modules/.pnpm/@nestjs+common@9.0.11_j5hagqx4mwzscud4kyjdvubauy/node_modules/@nestjs/common/decorators/http/create-route-param-metadata.decorator.d.ts:10

___

### initNestServer

▸ **initNestServer**<`T`\>(`router`): `Object`

**`Deprecated`**

Use `nestControllerContract`, `NestControllerInterface`, `NestRequestShapes`, and `NestResponseShapes` instead

**`See`**

[docs](https://ts-rest.com/docs/nest|ts-rest) for more info.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `T` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `controllerShape` | `NestControllerShapeFromAppRouter`<`T`\> |
| `responseShapes` | { [K in string \| number \| symbol]: T[K] extends AppRoute ? ApiResponseForRoute<any[any]\> : "not a route" } |
| `route` | `T` |
| `routeShapes` | `NestAppRouteShape`<`T`\> |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:47](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L47)

___

### nestControllerContract

▸ **nestControllerContract**<`T`\>(`router`): [`NestControllerContract`](ts_rest_nest.md#nestcontrollercontract)<`T`\>

Returns the contract containing only non-nested routes required by a NestJS controller

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `T` |

#### Returns

[`NestControllerContract`](ts_rest_nest.md#nestcontrollercontract)<`T`\>

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:71](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L71)
