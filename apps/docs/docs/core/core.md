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

## Query Parameters

All query parameters, by default, need to have an input type of `string` since query strings inherently cannot be typed, however, ts-rest allows you to encode query parameters as JSON values.
This will allow you to use input types other than strings in your contracts.

```typescript
const c = initContract();
export const contract = c.router({
    getPosts: {
        ...,
        query: z.object({
            take: z.number().default(10),
            skip: z.number().default(0),
            search: z.string().optional(),
        }),
    }
});
```

Check the relevant sections to see how to enable JSON query encoding/decoding on the client or server.

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

## Response Types

If you need to quickly extract the Response types from a given Contract, you can use the `ResponsesForRouter` type.

```typescript
import { ResponsesForRouter } from '@ts-rest/core'
import { contract } from './contract'

//  initContract() must called prior
type ResponseShapes = ResponsesForRouter<typeof contract>

async function someHttpCall(req: Request): Promise<ResponseShapes['getPosts']> {
  return ...
}
```

This is particularly useful for Services/Functions/Lambdas that do not use frameworks like Express or Nestjs. 
