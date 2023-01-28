# Fetch Client

Connect to your ts-rest instance

```typescript
export const client = initClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
});
```

## Query

**Query** against the contract, a _query_ is a function that does a GET request to the api.

```typescript
const { data } = await client.posts.get();
```

### Typed Query Parameters

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

## Mutate

**Mutate** against the contract, a _mutation_ is a function that does a POST, PUT, PATCH or DELETE request to the api.

```typescript
const { data, status } = await client.posts.create({
  body: {
    title: 'My Post',
    content: 'This is my post',
  },
});
```

:::info
Because we type status codes, to check if the request was successful, we can use the `status` property.

e.g.

```typescript
if (status === 200) {
  console.log('Success');
} else {
  console.log('Something went wrong');
}
```

## Return type

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
  baseUrl: "http://localhost:3333/api",
  baseHeaders: {},
  credentials: 'include'
})
```

## Notes About Basic Fetch Client

We use the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) API under the hood. 

We support basic fetch calls for application/json and text/plain content types and do not support content-type missing in resource response (per [security standards](https://knowledge-base.secureflag.com/vulnerabilities/security_misconfiguration/lack_of_content_type_headers_vulnerability.html)). If you need to implement custom API logic (like content-type header is missing for some reason, or need to handle different content types), you can implement your own Client: https://ts-rest.com/docs/core/custom