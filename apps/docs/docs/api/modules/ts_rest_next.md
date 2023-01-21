---
id: "ts_rest_next"
title: "Module: @ts-rest/next"
sidebar_label: "@ts-rest/next"
sidebar_position: 0
custom_edit_url: null
---

## Functions

### createNextRoute

▸ **createNextRoute**<`T`\>(`appRouter`, `implementation`): `RecursiveRouterObj`<`T`\>

Create the implementation for a given AppRouter.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `appRouter` | `T` | AppRouter |
| `implementation` | `RecursiveRouterObj`<`T`\> | Implementation of the AppRouter, e.g. your API controllers |

#### Returns

`RecursiveRouterObj`<`T`\>

#### Defined in

[libs/ts-rest/next/src/lib/ts-rest-next.ts:177](https://github.com/oliverbutler/tscont/blob/2b17a44/libs/ts-rest/next/src/lib/ts-rest-next.ts#L177)

___

### createNextRouter

▸ **createNextRouter**<`T`\>(`routes`, `obj`, `options?`): (`req`: `NextApiRequest`, `res`: `NextApiResponse`<`any`\>) => `Promise`<`void`\>

Turn a completed set of Next routes into a Next.js compatible route.

Should be exported from your [...ts-rest].tsx file.

e.g.

```typescript
export default createNextRouter(contract, implementation);
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `AppRouter` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `routes` | `T` | `undefined` |
| `obj` | `RecursiveRouterObj`<`T`\> | `undefined` |
| `options` | `Object` | `undefined` |
| `options.jsonQuery` | `boolean` | `false` |

#### Returns

`fn`

▸ (`req`, `res`): `Promise`<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `NextApiRequest` |
| `res` | `NextApiResponse`<`any`\> |

##### Returns

`Promise`<`void`\>

#### Defined in

[libs/ts-rest/next/src/lib/ts-rest-next.ts:199](https://github.com/oliverbutler/tscont/blob/2b17a44/libs/ts-rest/next/src/lib/ts-rest-next.ts#L199)

___

### isAppRouteWithImplementation

▸ **isAppRouteWithImplementation**(`obj`): obj is any

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

obj is any

#### Defined in

[libs/ts-rest/next/src/lib/ts-rest-next.ts:98](https://github.com/oliverbutler/tscont/blob/2b17a44/libs/ts-rest/next/src/lib/ts-rest-next.ts#L98)
