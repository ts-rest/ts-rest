# Route Helpers

Easiest way to get started with using `ts-core/express` is just by following the [Express Server](express.mdx), but there might be cases where you want to split the implementation of your routes into separate files or use a different structure. 

In this case, you can use the following helpers to define implementation for your routes.

## `makeAppRouteImplementation`

`makeAppRouteImplementation` is a helper function that enables you in a type-safe way to define the implementation of a single route. This route implementation can be exported and reused across multiple routes if it is desired.

Example usage where the route implementation is being defined independently of the route server definition. Building on the contract example from [Contract](../core/core.md):

```ts title="src/routes/posts.ts"
import { makeAppRouteImplementation } from '@ts-core/express';
import { contract } from '../contracts'

export const createPostImpl = makeAppRouteImplementation(contract.createPost, async (req, res) => {
  // create post implementation
  return { status: 201, body: /** created post */ };
});

export const getPostsImpl = makeAppRouteImplementation(contract.getPosts, async (req, res) => {
  // get posts implementation
  return { status: 200, body: /** posts */ };
});
```

```ts title="src/server.ts"
import { initServer } from '@ts-core/express';
import { createPostImpl, getPostsImpl } from './routes/posts';
import { contract } from './contracts';

const s = initServer();

const router = s.router(contract, { createPost: createPostImpl, getPosts: getPostsImpl });
```


