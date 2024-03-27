# Contract Helpers

For most cases, the simplest way to defining a contract would be just to follow the proposed structure in [Contract](./core.md). However, there are some cases where you may want to define a contract in separate files or use a different structure. Or, you may want to reuse route or response definitions across multiple contracts. 

In this case, you can use the following helpers to define your contract.

## `makeRoute`

`makeRoute` is a helper function that creates a single route definition. This route definition can be exported and reused across multiple contracts.

Example usage where routes are being defined independently of the contract definition and then combined:

```ts title="src/contracts/posts.ts"
import { makeRoute, makeType } from '@ts-rest/core';
import z from 'zod'

const createPost = makeRoute({
  method: 'POST',
  path: '/posts',
  responses: {
    201: makeType<Post>(),
  },
  body: z.object({
    title: z.string(),
    content: z.string(),
    published: z.boolean().optional(),
    description: z.string().optional(),
  }),
  summary: 'Create a post',
  metadata: { role: 'user' } as const,
});

const getPosts = makeRoute({
  method: 'GET',
  path: '/posts',
  responses: {
    200: makeType<{ posts: Post[]; total: number }>(),
  },
  headers: z.object({
    pagination: z.string().optional(),
  }),
  query: z.object({
    take: z.string().transform(Number).optional(),
    skip: z.string().transform(Number).optional(),
    search: z.string().optional(),
  }),
  summary: 'Get all posts',
  metadata: { role: 'guest' } as const,
});

const c = initContract();

export const contract = c.router({ createPost, getPosts });
```

## `makeResponses`

`makeResponses` is a helper function that creates a responses object. This responses object can be exported and reused across multiple contracts. 

Example usage where there are defined default error responses and reused across multiple routes:

```ts title="src/contracts/defaultErrorResponses.ts"
import { makeResponses, makeType } from '@ts-rest/core';

export const defaultErrorResponses = makeResponses({
  400: makeType<{ message: string }>(),
  500: makeType<{ message: string }>(),
});

// src/contracts/posts.ts
import { defaultErrorResponses } from './defaultErrorResponses';

const c = initContract();
export const contract = c.router({
  createPost: {
    method: 'POST',
    path: '/posts',
    responses: {
      201: makeType<Post>,
      ...defaultErrorResponses,
    },
    //...
  },
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: makeType<{ posts: Post[]; total: number }>,
      ...defaultErrorResponses,
    },
    //...
  },
});

```