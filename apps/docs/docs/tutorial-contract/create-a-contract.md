---
sidebar_position: 1
---

# Create a Contract

## Installation

Install @ts-rest/core

npm

```bash
npm install @ts-rest/core
```

yarn

```bash
yarn add @ts-rest/core
```

## Complete Example

Zod is optional, but I recommend using it to validate your request bodies in the server implementation.

```typescript
import { initTsCont } from '@ts-rest/core';
import { z } from 'zod';

const c = initTsCont();

export type Post = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  published: boolean;
  authorId: string;
};

// Three endpoints, two for posts, and one for health
export const router = c.router({
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post | null>(),
      query: null,
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
      query: z.object({
        take: z.number().optional(),
        skip: z.number().optional(),
      }),
    }),
    createPost: c.mutation({
      method: 'POST',
      path: () => '/posts',
      response: c.response<Post>(),
      body: z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
        description: z.string().optional(),
        authorId: z.string(),
      }),
    }),
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: c.response<{ message: string }>(),
    query: null,
  }),
});
```
