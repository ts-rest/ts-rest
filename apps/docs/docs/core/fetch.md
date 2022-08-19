# Fetch Client

Connect to your tRPC instance

```typescript
export const client = initClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
});
```

**Query** against the contract, a _query_ is a function that does a GET request to the api.

```typescript
const { data } = await client.posts.get();
```

**Mutate** against the contract, a _mutation_ is a function that does a POST, PUT, PATCH or DELETE request to the api.

```typescript
const { data } = await client.posts.create({
  body: {
    title: 'My Post',
    content: 'This is my post',
  },
});
```
