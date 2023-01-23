---
id: "ts_rest_open_api"
title: "Module: @ts-rest/open-api"
sidebar_label: "@ts-rest/open-api"
sidebar_position: 0
custom_edit_url: null
---

## Functions

### generateOpenApi

▸ **generateOpenApi**(`router`, `apiDoc`, `options?`): `OpenAPIObject`

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | `AppRouter` |
| `apiDoc` | `Omit`<`OpenAPIObject`, ``"paths"`` \| ``"openapi"``\> & { `info`: `InfoObject`  } |
| `options` | `Object` |
| `options.jsonQuery?` | `boolean` |
| `options.setOperationId?` | `boolean` |

#### Returns

`OpenAPIObject`

#### Defined in

[libs/ts-rest/open-api/src/lib/ts-rest-open-api.ts:89](https://github.com/oliverbutler/tscont/blob/a098fd1/libs/ts-rest/open-api/src/lib/ts-rest-open-api.ts#L89)
