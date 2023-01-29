---
id: "ts_rest_nest.TsRestInterceptor"
title: "Class: TsRestInterceptor"
sidebar_label: "@ts-rest/nest.TsRestInterceptor"
custom_edit_url: null
---

[@ts-rest/nest](../modules/ts_rest_nest.md).TsRestInterceptor

## Implements

- `NestInterceptor`

## Constructors

### constructor

• **new TsRestInterceptor**()

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

[libs/ts-rest/nest/src/lib/ts-rest.interceptor.ts:22](https://github.com/oliverbutler/tscont/blob/ddc62fe/libs/ts-rest/nest/src/lib/ts-rest.interceptor.ts#L22)
