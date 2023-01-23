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

[libs/ts-rest/express/src/lib/ts-rest-express.ts:37](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/express/src/lib/ts-rest-express.ts#L37)

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

[libs/ts-rest/express/src/lib/ts-rest-express.ts:238](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/express/src/lib/ts-rest-express.ts#L238)

___

### getValue

▸ **getValue**<`TData`, `TPath`, `TDefault`\>(`data`, `path`, `defaultValue?`): `GetFieldType`<`TData`, `TPath`\> \| `TDefault`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TData` | `TData` |
| `TPath` | extends `string` |
| `TDefault` | `GetFieldType`<`TData`, `TPath`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `TData` |
| `path` | `TPath` |
| `defaultValue?` | `TDefault` |

#### Returns

`GetFieldType`<`TData`, `TPath`\> \| `TDefault`

#### Defined in

[libs/ts-rest/express/src/lib/ts-rest-express.ts:17](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/express/src/lib/ts-rest-express.ts#L17)

___

### initServer

▸ **initServer**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `router` | <T\>(`router`: `T`, `args`: `RecursiveRouterObj`<`T`\>) => `RecursiveRouterObj`<`T`\> |

#### Defined in

[libs/ts-rest/express/src/lib/ts-rest-express.ts:95](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/express/src/lib/ts-rest-express.ts#L95)
