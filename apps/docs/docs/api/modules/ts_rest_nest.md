---
id: "ts_rest_nest"
title: "Module: @ts-rest/nest"
sidebar_label: "@ts-rest/nest"
sidebar_position: 0
custom_edit_url: null
---

## Classes

- [ApiRouteInterceptor](../classes/ts_rest_nest.ApiRouteInterceptor.md)

## Type Aliases

### ApiDecoratorShape

Ƭ **ApiDecoratorShape**<`TRoute`\>: `Without`<{ `body`: `TRoute` extends `AppRouteMutation` ? `BodyWithoutFileIfMultiPart`<`TRoute`\> : `never` ; `params`: `PathParamsWithCustomValidators`<`TRoute`\> ; `query`: `ZodInferOrType`<`TRoute`[``"query"``]\>  }, `never`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRoute` | extends `AppRoute` |

#### Defined in

[libs/ts-rest/nest/src/lib/api.decorator.ts:37](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/api.decorator.ts#L37)

___

### NestAppRouteShape

Ƭ **NestAppRouteShape**<`T`\>: `AppRouteShape`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:29](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L29)

___

### NestControllerShapeFromAppRouter

Ƭ **NestControllerShapeFromAppRouter**<`T`\>: `Without`<`AppRouterControllerShape`<`T`\>, `AppRouter`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:24](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L24)

## Variables

### JsonQuerySymbol

• `Const` **JsonQuerySymbol**: typeof [`JsonQuerySymbol`](ts_rest_nest.md#jsonquerysymbol)

#### Defined in

[libs/ts-rest/nest/src/lib/json-query.decorator.ts:1](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/json-query.decorator.ts#L1)

## Functions

### Api

▸ **Api**(`appRoute`): `MethodDecorator`

#### Parameters

| Name | Type |
| :------ | :------ |
| `appRoute` | `AppRoute` |

#### Returns

`MethodDecorator`

#### Defined in

[libs/ts-rest/nest/src/lib/api.decorator.ts:138](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/api.decorator.ts#L138)

___

### ApiDecorator

▸ **ApiDecorator**(`...dataOrPipes`): `ParameterDecorator`

Defines HTTP route param decorator

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

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `jsonQuery` | `boolean` | `true` |

#### Returns

`ClassDecorator` & `MethodDecorator`

#### Defined in

[libs/ts-rest/nest/src/lib/json-query.decorator.ts:3](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/json-query.decorator.ts#L3)

___

### initNestServer

▸ **initNestServer**<`T`\>(`router`): `Object`

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
| `controllerShape` | [`NestControllerShapeFromAppRouter`](ts_rest_nest.md#nestcontrollershapefromapprouter)<`T`\> |
| `responseShapes` | { [K in string \| number \| symbol]: T[K] extends AppRoute ? ApiResponseForRoute<any[any]\> : "not a route" } |
| `route` | `T` |
| `routeShapes` | `AppRouteShape`<`T`\> |

#### Defined in

[libs/ts-rest/nest/src/lib/ts-rest-nest.ts:31](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/nest/src/lib/ts-rest-nest.ts#L31)
