# Fetch Client

All of the client libraries (`@ts-rest/core`, `@ts-rest/react-query`, and `@ts-rest/solid-query`) all use the `initClient` or `initQueryClient` functions to create a client. These functions take a `baseUrl` and `baseHeaders` as the first two arguments, and then an optional `api` argument as the third argument.

```typescript
import { initClient } from '@ts-rest/core';
import { getAccessToken } from '@some-auth-lib/sdk';
import { contract } from './contract';

export const client = initClient(contract, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {
    'x-app-source': 'ts-rest',
    'x-access-token': () => getAccessToken(),
  },
});
```

To customise the fetching behaviour, add an `api` function, please see [Custom API](/core/custom.md) for more information.

## Query and Mutate

Your contract uses regular HTTP methods to define the type of request you want to make. We use this type to infer whether you are doing a `query` or a `mutate` request.

Any requests that use the `GET` method will be treated as a `query` request, and any requests that use the `POST`, `PUT`, `PATCH` or `DELETE` methods will be treated as a `mutate` request.

```typescript
const { data } = await client.posts.get();

const { data, status } = await client.posts.create({
  body: {
    title: 'My Post',
    content: 'This is my post',
  },
});
```

Breaking down the arguments:

- `body` - The body of the request, only used for `POST`, `PUT`, `PATCH` requests.
- `query` - The query parameters of the request.
- `headers` - Request headers defined in the contract (merged and overrides any `baseHeaders` defined in the client)
- `extraHeaders` - If you want to pass headers not defined in the contract
- `params` - The path parameters of the request.
- `fetchOptions` - Additional fetch options to pass to the fetch function.
- `overrideClientOptions` - Override the client options for this request.

:::tip Customise the API 🎨

You can add your own custom arguments to the request, and they will be passed through to the `api` function - Read more here! [Custom API](/core/custom.md)

```typescript
const client = initClient(contract, {
  // ...
  api: async (args: ApiFetcherArgs & { custom?: string }) => {
    return tsRestFetchApi(args);
  },
});

const { data } = await client.getPosts({
  custom: 'argument',
});
```

:::

## Understanding the Return Type

Because we type status codes, to check if the request was successful, we can use the `status` property.

```typescript
const data = await client.posts.create({
  body: {
    title: 'My Post',
    content: 'This is my post',
  },
});

if (data.status === 200) {
  console.log('Success');
} else {
  console.log('Something went wrong');
}
```

:::info

The `data` property is typed as follows:

```typescript
const data: {
    status: 200;
    body: User;
    headers: Headers
} | {
    status: 400 | 100 | 101 | 102 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 300 | 301 | 302 | 303 | 304 | 305 | 307 | ... 36 more ... | 511;
    body: unknown;
    headers: Headers
}
```

In this context, the term 'headers' refers to the response headers retrieved either from the default Fetch client or a custom client implementation.
:::

## Credentials (Sending Cookies)

The `fetch()` function used by ts-rest does not send cookies in cross-origin requests by default unless the `credentials`
option is set to `include`.

```typescript
const client = initClient(contract, {
  baseUrl: 'http://localhost:3333/api',
  baseHeaders: {},
  credentials: 'include',
});
```

## Typed Query Parameters

By default, all query parameters are encoded as strings, however, you can use the `jsonQuery` option to encode query parameters as typed JSON values.
Make sure to enable JSON query handling on the server as well.

```typescript
const client = initClient(contract, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
  jsonQuery: true,
});

const { data } = await client.posts.get({
  query: {
    take: 10,
    skip: 0,
    search: 'hello',
  },
});
```

:::caution

Objects implementing `.toJSON()` will irreversibly be converted to JSON, so you will need to use custom zod transforms to convert back to the original object types.

For example, Date objects will be converted ISO strings by default, so you could handle this case like so:

```typescript
const dateSchema = z
  .union([z.string().datetime(), z.date()])
  .transform((date) => (typeof date === 'string' ? new Date(date) : date));
```

This will ensure that you could pass Date objects in your client queries. They will be converted to ISO strings in the JSON-encoded URL query string, and then converted back to Date objects on the server by zod's parser.

:::

## Validate Response

The `validateResponse` option allows you to validate the response body against the response schema. This is useful for ensuring that the server is returning the correct response type or performing transformations that are part of the response schema. For this to work, the responses schema must be defined using Zod (`c.type<>` will not check types at runtime).

```typescript
const c = initContract();
export const contract = c.router({
  method: 'GET',
  path: '/post/:id',
  responses: {
    200: z.object({
      id: z.string(),
      createdAt: z.coerce.date(),
    }),
  },
});

const client = initClient(contract, { validateResponse: true });
const response = await client.getPost({ id: '1' });
// response will be validated against the response schema
if (response.status === 200) {
  // response.data will be of type { id: string, createdAt: Date }
  // because `createdAt` has transformation of `z.coerce.date()`, it will parse any string date into a Date object
}
```

:::caution

If you are doing any non-idempotent Zod transforms that run on the server, response validation may fail on the client or produce an unintended double transformation is certain cases. Make sure your transformations are idempotent.

```typescript
// ❌❌
z.date().transform((d) => d.toISOString());
z.number().transform((n) => n + 1000);
z.string().transform((s) => `Hello, ${s}`);

// ✅✅
z.coerce.date();
z.string().transform((s) => s.toUpperCase());
z.union([z.string().datetime(), z.date()])
  .transform((date) => (typeof date === 'string' ? new Date(date) : date));
```

:::

## Notes About Basic Fetch Client

We use the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) API under the hood.

Our built-in fetch client handles the majority of use cases such as automatically parsing response bodies to JSON or text based on the `Content-Type` header.
However, if you need to handle some different behavior, or add extra functionality such as injecting API tokens into requests, you can implement your own
[custom fetcher or wrap the built-in fetcher](custom.md).

## Using the Client on Node.js

Since we use the `fetch` API internally, the minimum supported version of Node.js is v18

#### For Node.js v18

For file uploads, we use the `File` class, which is only available in Node.js >= 18.13.0

However, for Node.js versions below v20, the `File` class is not exposed globally as it is an experimental feature in v18.
Therefore, you will need to expose it globally in your code entrypoint so ts-rest can use it.

```ts
import { File as NodeFile } from 'node:buffer';
declare global {
  interface File extends NodeFile {}
  var File: typeof NodeFile;
}
globalThis.File = NodeFile;
```
