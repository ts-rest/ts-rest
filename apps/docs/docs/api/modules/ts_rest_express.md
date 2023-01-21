---
id: "ts_rest_express"
title: "Module: @ts-rest/express"
sidebar_label: "@ts-rest/express"
sidebar_position: 0
custom_edit_url: null
---

## Type Aliases

### ApiRouteResponse

Ƭ **ApiRouteResponse**<`T`\>: { [K in keyof T]: Object }[keyof `T`]

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[libs/ts-rest/express/src/lib/ts-rest-express.ts:17](https://github.com/oliverbutler/tscont/blob/2b17a44/libs/ts-rest/express/src/lib/ts-rest-express.ts#L17)

## Functions

### createExpressEndpoints

▸ **createExpressEndpoints**<`T`, `TRouter`\>(`schema`, `router`, `app`, `options?`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `RecursiveRouterObj`<`TRouter`\> |
| `TRouter` | extends `AppRouter` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `TRouter` |
| `router` | `T` |
| `app` | `IRouter` |
| `options` | `Options` |

#### Returns

`void`

#### Defined in

[libs/ts-rest/express/src/lib/ts-rest-express.ts:218](https://github.com/oliverbutler/tscont/blob/2b17a44/libs/ts-rest/express/src/lib/ts-rest-express.ts#L218)

___

### initServer

▸ **initServer**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `router` | <T\>(`router`: `T`, `args`: `RecursiveRouterObj`<`T`\>) => `RecursiveRouterObj`<`T`\> |

#### Defined in

[libs/ts-rest/express/src/lib/ts-rest-express.ts:75](https://github.com/oliverbutler/tscont/blob/2b17a44/libs/ts-rest/express/src/lib/ts-rest-express.ts#L75)
