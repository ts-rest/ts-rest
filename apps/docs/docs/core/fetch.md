# Client

All of the client libraries (`@ts-rest/core`, `@ts-rest/react-query`, and `@ts-rest/solid-query`) all use the `initClient` or `initQueryClient` functions to create a client. These functions take a `baseUrl` and `baseHeaders` as the first two arguments, and then an optional `api` argument as the third argument.

```typescript
export const client = initClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
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
- `headers` - The headers of the request (merged and overridden with `baseHeaders` in the client)
- `params` - The path parameters of the request.

:::tip Customise the API 🎨

You can add your own custom arguments to the request, and they will be passed through to the `api` function - Read more here! [Custom API](/core/custom.md)

```typescript
const client = initQueryClient(postsApi, {
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

## Understanding the return type

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
    body: User
} | {
    status: 400 | 100 | 101 | 102 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 300 | 301 | 302 | 303 | 304 | 305 | 307 | ... 36 more ... | 511;
    body: unknown;
}
```

:::

## Credentials (sending cookies)

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
const client = initClient(router, {
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

## Notes About Basic Fetch Client

We use the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) API under the hood.

We support basic fetch calls for application/json and text/plain content types and do not support content-type missing in resource response (per [security standards](https://knowledge-base.secureflag.com/vulnerabilities/security_misconfiguration/lack_of_content_type_headers_vulnerability.html)). If you need to implement custom API logic (like content-type header is missing for some reason, or need to handle different content types), you can implement your own Client: https://ts-rest.com/docs/core/custom
