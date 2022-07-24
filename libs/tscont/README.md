# tscont

## Motivation

tscont aims to allow for the creation of type safe contracts to be upheld by producers and consumers of the contract.

Some end-to-end type safe libraries such as [tRPC](https://trpc.io/) are amazing, however, they aren't able to separate the contract from the implementation, in situations with published packages or wanting to avoid unnecessary rebuilds with tools such as NX this is a problem.

One example of this is with NX, in NX you can rebuild only "affected" packages, however, if you export your contract (e.g. tRPC) from the backend, your front end will need to be rebuilt as well.

## Contract Abstraction

## Implementation - API

Contract

```typescript
import { initTsCont } from 'tscont';

const c = initTsCont();

export type Post = {
  id: number;
  title: string;
  body: string;
};

export const router = c.router({
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post>(),
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
  }),
});
```

Client

```typescript
const client = initClient(router, {
  api: fetchApi,
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

const { data } = await client.posts.getPosts();
```

Server

```typescript
const server = initServer(router, {
  api: fetchApi,
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

// TRPC-like type-safe generation or just extract input/output types
```
