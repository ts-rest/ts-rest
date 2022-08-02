---
title: '@ts-rest/core'
sidebar_position: 3
---

# Core

The `@ts-rest/core` package contains the required types to generate a contract, and query against an api with a basic fetch client.

## Contract

Define a contract with the `@ts-rest/core` package, you may nest routers within a router, generally you'd want a router for each nested resource e.g. `/users/:id/posts` could have a nested router `contract.users.posts`, this path is what you'd use on the client to query the API.

Breaking down the contract to sub-routers also allows you to split up the backend implementation, for example in Nest.js you could have multiple controllers for the sub-routers.

```typescript
const c = initContract();

export const contract = c.router({
  posts: c.router({
    get: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
    create: c.mutation({
      method: 'POST',
      path: () => '/posts',
      body: z.object({
        title: z.string(),
        content: z.string(),
      }),
      response: c.response<Post>(),
    }),
  }),
});
```

## Fetch Client

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
