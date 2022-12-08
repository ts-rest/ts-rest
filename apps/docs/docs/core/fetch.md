# Fetch Client

Connect to your ts-rest instance

```typescript
export const client = initClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
});
```

### Query

**Query** against the contract, a _query_ is a function that does a GET request to the api.

```typescript
const { data } = await client.posts.get();
```

### Mutate

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

### Return type

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
