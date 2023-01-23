---
id: "ts_rest_core"
title: "Module: @ts-rest/core"
sidebar_label: "@ts-rest/core"
sidebar_position: 0
custom_edit_url: null
---

## Interfaces

- [ClientArgs](../interfaces/ts_rest_core.ClientArgs.md)

## Type Aliases

### ApiResponseForRoute

Ƭ **ApiResponseForRoute**<`T`\>: [`ApiRouteResponse`](ts_rest_core.md#apirouteresponse)<`T`[``"responses"``]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`AppRoute`](ts_rest_core.md#approute) |

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:73](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L73)

___

### ApiRouteResponse

Ƭ **ApiRouteResponse**<`T`\>: { [K in keyof T]: Object }[keyof `T`] \| { `body`: `unknown` ; `status`: `Exclude`<[`HTTPStatusCode`](ts_rest_core.md#httpstatuscode), keyof `T`\>  }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:61](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L61)

___

### AppRoute

Ƭ **AppRoute**: [`AppRouteQuery`](ts_rest_core.md#approutequery) \| [`AppRouteMutation`](ts_rest_core.md#approutemutation)

A union of all possible endpoint types.

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:54](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L54)

___

### AppRouteFunction

Ƭ **AppRouteFunction**<`TRoute`\>: [`AreAllPropertiesOptional`](ts_rest_core.md#areallpropertiesoptional)<[`Without`](ts_rest_core.md#without)<`DataReturnArgs`<`TRoute`\>, `never`\>\> extends ``true`` ? (`args?`: [`Without`](ts_rest_core.md#without)<`DataReturnArgs`<`TRoute`\>, `never`\>) => `Promise`<[`ApiRouteResponse`](ts_rest_core.md#apirouteresponse)<`TRoute`[``"responses"``]\>\> : (`args`: [`Without`](ts_rest_core.md#without)<`DataReturnArgs`<`TRoute`\>, `never`\>) => `Promise`<[`ApiRouteResponse`](ts_rest_core.md#apirouteresponse)<`TRoute`[``"responses"``]\>\>

Returned from a mutation or query call

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TRoute` | extends [`AppRoute`](ts_rest_core.md#approute) |

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:79](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L79)

___

### AppRouteMutation

Ƭ **AppRouteMutation**: `Object`

A mutation endpoint. In REST terms, one using POST, PUT,
PATCH, or DELETE.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `body` | `unknown` |
| `contentType?` | ``"application/json"`` \| ``"multipart/form-data"`` |
| `deprecated?` | `boolean` |
| `description?` | `string` |
| `method` | ``"POST"`` \| ``"DELETE"`` \| ``"PUT"`` \| ``"PATCH"`` |
| `path` | `Path` |
| `pathParams?` | `unknown` |
| `query?` | `unknown` |
| `responses` | `Record`<`number`, `unknown`\> |
| `summary?` | `string` |

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:25](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L25)

___

### AppRouteQuery

Ƭ **AppRouteQuery**: `Object`

A query endpoint. In REST terms, one using GET.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `deprecated?` | `boolean` |
| `description?` | `string` |
| `method` | ``"GET"`` |
| `path` | `Path` |
| `pathParams?` | `unknown` |
| `query?` | `unknown` |
| `responses` | `Record`<`number`, `unknown`\> |
| `summary?` | `string` |

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:10](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L10)

___

### AppRouter

Ƭ **AppRouter**: `Object`

A router (or contract) in @ts-rest is a collection of more routers or
individual routes

#### Index signature

▪ [key: `string`]: [`AppRouter`](ts_rest_core.md#approuter) \| [`AppRoute`](ts_rest_core.md#approute)

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:60](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L60)

___

### AreAllPropertiesOptional

Ƭ **AreAllPropertiesOptional**<`T`\>: `T` extends `Record`<`string`, `unknown`\> ? `Exclude`<keyof `T`, `OptionalKeys`<`T`\>\> extends `never` ? ``true`` : ``false`` : ``false``

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:68](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L68)

___

### GetFieldType

Ƭ **GetFieldType**<`T`, `P`\>: `P` extends \`${infer Left}.${infer Right}\` ? `Left` extends keyof `T` ? `FieldWithPossiblyUndefined`<`T`[`Left`], `Right`\> : `Left` extends \`${infer FieldKey}[${infer IndexKey}]\` ? `FieldKey` extends keyof `T` ? `FieldWithPossiblyUndefined`<`IndexedFieldWithPossiblyUndefined`<`T`[`FieldKey`], `IndexKey`\>, `Right`\> : `undefined` : `undefined` : `P` extends keyof `T` ? `T`[`P`] : `P` extends \`${infer FieldKey}[${infer IndexKey}]\` ? `FieldKey` extends keyof `T` ? `IndexedFieldWithPossiblyUndefined`<`T`[`FieldKey`], `IndexKey`\> : `undefined` : `undefined`

#### Type parameters

| Name |
| :------ |
| `T` |
| `P` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:21](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L21)

___

### HTTPStatusCode

Ƭ **HTTPStatusCode**: ``100`` \| ``101`` \| ``102`` \| ``200`` \| ``201`` \| ``202`` \| ``203`` \| ``204`` \| ``205`` \| ``206`` \| ``207`` \| ``300`` \| ``301`` \| ``302`` \| ``303`` \| ``304`` \| ``305`` \| ``307`` \| ``308`` \| ``400`` \| ``401`` \| ``402`` \| ``403`` \| ``404`` \| ``405`` \| ``406`` \| ``407`` \| ``408`` \| ``409`` \| ``410`` \| ``411`` \| ``412`` \| ``413`` \| ``414`` \| ``415`` \| ``416`` \| ``417`` \| ``418`` \| ``419`` \| ``420`` \| ``421`` \| ``422`` \| ``423`` \| ``424`` \| ``428`` \| ``429`` \| ``431`` \| ``451`` \| ``500`` \| ``501`` \| ``502`` \| ``503`` \| ``504`` \| ``505`` \| ``507`` \| ``511``

All available HTTP Status codes

#### Defined in

[libs/ts-rest/core/src/lib/status-codes.ts:14](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/status-codes.ts#L14)

___

### InitClientReturn

Ƭ **InitClientReturn**<`T`\>: `RecursiveProxyObj`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`AppRouter`](ts_rest_core.md#approuter) |

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:227](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L227)

___

### Merge

Ƭ **Merge**<`T`, `U`\>: `Omit`<`T`, keyof `U`\> & `U`

#### Type parameters

| Name |
| :------ |
| `T` |
| `U` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:55](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L55)

___

### OptionalIfAllOptional

Ƭ **OptionalIfAllOptional**<`T`, `Select`\>: [`PartialBy`](ts_rest_core.md#partialby)<`T`, `Select` & { [K in keyof T]: AreAllPropertiesOptional<T[K]\> extends true ? K : never }[keyof `T`]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `Select` | extends keyof `T` = keyof `T` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:74](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L74)

___

### ParamsFromUrl

Ƭ **ParamsFromUrl**<`T`\>: `RecursivelyExtractPathParams`<`T`, {}\> extends infer U ? keyof `U` extends `never` ? `undefined` : { [key in keyof U]: U[key] } : `never`

Extract path params from path function

`{ id: string, commentId: string }`

**`Params`**

T - The URL e.g. /posts/:id

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` |

#### Defined in

[libs/ts-rest/core/src/lib/paths.ts:31](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/paths.ts#L31)

___

### PartialBy

Ƭ **PartialBy**<`T`, `K`\>: `Omit`<`T`, `K`\> & `Partial`<`Pick`<`T`, `K`\>\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `K` | extends keyof `T` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:57](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L57)

___

### PathParamsFromUrl

Ƭ **PathParamsFromUrl**<`T`\>: [`ParamsFromUrl`](ts_rest_core.md#paramsfromurl)<`T`[``"path"``]\> extends infer U ? `U` : `never`

Extract the path params from the path in the contract

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`AppRoute`](ts_rest_core.md#approute) |

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:27](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L27)

___

### PathParamsWithCustomValidators

Ƭ **PathParamsWithCustomValidators**<`T`\>: `T`[``"pathParams"``] extends `undefined` ? [`PathParamsFromUrl`](ts_rest_core.md#pathparamsfromurl)<`T`\> : [`Merge`](ts_rest_core.md#merge)<[`PathParamsFromUrl`](ts_rest_core.md#pathparamsfromurl)<`T`\>, [`ZodInferOrType`](ts_rest_core.md#zodinferortype)<`T`[``"pathParams"``]\>\>

Merge `PathParamsFromUrl<T>` with pathParams schema if it exists

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`AppRoute`](ts_rest_core.md#approute) |

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:36](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L36)

___

### SuccessfulHttpStatusCode

Ƭ **SuccessfulHttpStatusCode**: ``200`` \| ``201`` \| ``202`` \| ``203`` \| ``204`` \| ``205`` \| ``206`` \| ``207``

#### Defined in

[libs/ts-rest/core/src/lib/status-codes.ts:1](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/status-codes.ts#L1)

___

### With

Ƭ **With**<`T`, `V`\>: `Pick`<`T`, `ExcludeKeysWithoutTypeOf`<`T`, `V`\>\>

#### Type parameters

| Name |
| :------ |
| `T` |
| `V` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:51](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L51)

___

### Without

Ƭ **Without**<`T`, `V`\>: `Pick`<`T`, `ExcludeKeysWithTypeOf`<`T`, `V`\>\>

#### Type parameters

| Name |
| :------ |
| `T` |
| `V` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:50](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L50)

___

### ZodInferOrType

Ƭ **ZodInferOrType**<`T`\>: `T` extends `ZodTypeAny` ? `z.infer`<`T`\> : `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[libs/ts-rest/core/src/lib/type-utils.ts:53](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/type-utils.ts#L53)

## Functions

### checkZodSchema

▸ **checkZodSchema**(`data`, `schema`, `«destructured»?`): { `data`: `unknown` ; `success`: ``true``  } \| { `error`: `unknown` ; `success`: ``false``  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `unknown` |
| `schema` | `unknown` |
| `«destructured»` | `Object` |
| › `passThroughExtraKeys` | `undefined` \| `boolean` |

#### Returns

{ `data`: `unknown` ; `success`: ``true``  } \| { `error`: `unknown` ; `success`: ``false``  }

#### Defined in

[libs/ts-rest/core/src/lib/zod-utils.ts:9](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/zod-utils.ts#L9)

___

### convertQueryParamsToUrlString

▸ **convertQueryParamsToUrlString**(`query`, `json?`): `string`

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `query` | `unknown` | `undefined` | Any JSON object |
| `json` | `boolean` | `false` | Use JSON.stringify to encode the query values |

#### Returns

`string`

- The query url segment, using explode array syntax, and deep object syntax

#### Defined in

[libs/ts-rest/core/src/lib/query.ts:7](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/query.ts#L7)

___

### defaultApi

▸ **defaultApi**(`args`): `Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.body` | `undefined` \| ``null`` \| `string` \| `FormData` |
| `args.credentials?` | `RequestCredentials` |
| `args.headers` | `Record`<`string`, `string`\> |
| `args.method` | `string` |
| `args.path` | `string` |

#### Returns

`Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:96](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L96)

___

### encodeQueryParams

▸ **encodeQueryParams**(`query`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `unknown` |

#### Returns

`string`

#### Defined in

[libs/ts-rest/core/src/lib/query.ts:41](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/query.ts#L41)

___

### encodeQueryParamsJson

▸ **encodeQueryParamsJson**(`query`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `unknown` |

#### Returns

`string`

#### Defined in

[libs/ts-rest/core/src/lib/query.ts:14](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/query.ts#L14)

___

### fetchApi

▸ **fetchApi**(`path`, `clientArgs`, `route`, `body`): `Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `clientArgs` | [`ClientArgs`](../interfaces/ts_rest_core.ClientArgs.md) |
| `route` | [`AppRoute`](ts_rest_core.md#approute) |
| `body` | `unknown` |

#### Returns

`Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:140](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L140)

___

### getCompleteUrl

▸ **getCompleteUrl**(`query`, `baseUrl`, `params`, `route`, `jsonQuery`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `query` | `unknown` |
| `baseUrl` | `string` |
| `params` | `unknown` |
| `route` | [`AppRoute`](ts_rest_core.md#approute) |
| `jsonQuery` | `boolean` |

#### Returns

`string`

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:173](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L173)

___

### getRouteQuery

▸ **getRouteQuery**<`TAppRoute`\>(`route`, `clientArgs`): (`inputArgs?`: `DataReturnArgs`<`any`\>) => `Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TAppRoute` | extends [`AppRoute`](ts_rest_core.md#approute) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `route` | `TAppRoute` |
| `clientArgs` | [`ClientArgs`](../interfaces/ts_rest_core.ClientArgs.md) |

#### Returns

`fn`

▸ (`inputArgs?`): `Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `inputArgs?` | `DataReturnArgs`<`any`\> |

##### Returns

`Promise`<{ `body`: `unknown` ; `status`: `number`  }\>

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:188](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L188)

___

### getRouteResponses

▸ **getRouteResponses**<`T`\>(`router`): { [K in string \| number \| symbol]: T[K] extends AppRoute ? ApiResponseForRoute<any[any]\> : "not a route" }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`AppRouter`](ts_rest_core.md#approuter) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `T` |

#### Returns

{ [K in string \| number \| symbol]: T[K] extends AppRoute ? ApiResponseForRoute<any[any]\> : "not a route" }

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:241](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L241)

___

### initClient

▸ **initClient**<`T`\>(`router`, `args`): `RecursiveProxyObj`<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`AppRouter`](ts_rest_core.md#approuter) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `T` |
| `args` | [`ClientArgs`](../interfaces/ts_rest_core.ClientArgs.md) |

#### Returns

`RecursiveProxyObj`<`T`\>

#### Defined in

[libs/ts-rest/core/src/lib/client.ts:229](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/client.ts#L229)

___

### initContract

▸ **initContract**(): `ContractInstance`

Instantiate a ts-rest client, primarily to access `router`, `response`, and `body`

#### Returns

`ContractInstance`

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:113](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L113)

___

### initTsRest

▸ **initTsRest**(): `ContractInstance`

**`Deprecated`**

Please use [initContract](ts_rest_core.md#initcontract) instead.

#### Returns

`ContractInstance`

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:106](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L106)

___

### insertParamsIntoPath

▸ **insertParamsIntoPath**<`T`\>(`«destructured»`): `string`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `params` | [`ParamsFromUrl`](ts_rest_core.md#paramsfromurl)<`T`\> |
| › `path` | `T` |

#### Returns

`string`

- The URL with the params e.g. /posts/123

#### Defined in

[libs/ts-rest/core/src/lib/paths.ts:48](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/paths.ts#L48)

___

### isAppRoute

▸ **isAppRoute**(`obj`): obj is AppRoute

Differentiate between a route and a router

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | [`AppRouter`](ts_rest_core.md#approuter) \| [`AppRoute`](ts_rest_core.md#approute) |

#### Returns

obj is AppRoute

#### Defined in

[libs/ts-rest/core/src/lib/dsl.ts:70](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/dsl.ts#L70)

___

### isZodObject

▸ **isZodObject**(`body`): body is ZodObject<any, any, any, any, Object\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `unknown` |

#### Returns

body is ZodObject<any, any, any, any, Object\>

#### Defined in

[libs/ts-rest/core/src/lib/zod-utils.ts:3](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/zod-utils.ts#L3)

___

### parseJsonQueryObject

▸ **parseJsonQueryObject**(`query`): `Object`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `query` | `Record`<`string`, `string`\> | A server-side query object where values have been encoded as JSON strings |

#### Returns

`Object`

- The same object with the JSON strings decoded. Objects that were encoded using toJSON such as Dates will remain as strings

#### Defined in

[libs/ts-rest/core/src/lib/query.ts:102](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/core/src/lib/query.ts#L102)
