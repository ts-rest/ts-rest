---
id: "ts_rest_nest.ApiRouteInterceptor"
title: "Class: ApiRouteInterceptor"
sidebar_label: "@ts-rest/nest.ApiRouteInterceptor"
custom_edit_url: null
---

[@ts-rest/nest](../modules/ts_rest_nest.md).ApiRouteInterceptor

## Implements

- `NestInterceptor`

## Constructors

### constructor

• **new ApiRouteInterceptor**()

## Methods

### intercept

▸ **intercept**(`context`, `next`): `Observable`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `ExecutionContext` |
| `next` | `CallHandler`<`any`\> |

#### Returns

`Observable`<`any`\>

#### Implementation of

NestInterceptor.intercept

#### Defined in

[libs/ts-rest/nest/src/lib/api.decorator.ts:118](https://github.com/oliverbutler/tscont/blob/c65705a/libs/ts-rest/nest/src/lib/api.decorator.ts#L118)
