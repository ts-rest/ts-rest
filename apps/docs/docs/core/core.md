# Contract

Define a contract with the `@ts-rest/core` package, you may nest routers within a router, generally you'd want a router for each nested resource e.g. `/users/:id/posts` could have a nested router `contract.users.posts`, this path is what you'd use on the client to query the API.

Breaking down the contract to sub-routers also allows you to split up the backend implementation, for example in Nest.js you could have multiple controllers for the sub-routers.

```typescript
const c = initContract();

export const contract = c.router({
  createPost: {
    method: 'POST',
    path: '/posts',
    //     ^ Note! This is the full path on the server, not just the sub-path of a route
    responses: {
      201: c.response<Post>(),
    },
    body: z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean().optional(),
      description: z.string().optional(),
    }),
    summary: 'Create a post',
  },
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.response<{ posts: Post[]; total: number }>(),
    },
    query: z.object({
      take: z.string().transform(Number).optional(),
      skip: z.string().transform(Number).optional(),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
  },
});
```

## Combining Contracts

You can combine contracts to create a single contract, helpful if you want many sub contracts, especially if they are huge.

```typescript
const c = initContract();

export const postContract = c.router({
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.response<{ posts: Post[]; total: number }>(),
    },
    query: z.object({
      take: z.string().transform(Number).optional(),
      skip: z.string().transform(Number).optional(),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
  },
});

export const contract = c.router({
  posts: postContract,
});
```

## Intellisense

For intellisense on your contract types, you can use [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#type).

```typescript
const c = initContract();

export const contract = c.router({
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.response<{ posts: Post[]; total: number }>(),
    },
    query: z.object({
      /**
       * @type {string} - UTC timestamp in milliseconds
       */
      beginDate: z.string(),
      /**
       * @type {string} - UTC timestamp in milliseconds
       */
      endDate: z.string(),
    }),
    summary: 'Get posts within time-range',
  },
});
```
