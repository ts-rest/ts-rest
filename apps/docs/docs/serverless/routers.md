# Defining Routers

For all the serverless handlers we export a helper object that can help you define your router implementation separate from the main handler function.
You can also use it to split up the implementation for different parts of your application. This can be useful for organizing your code and keeping it maintainable.

```typescript
import { tsr } from '@ts-rest/serverless/aws';
import { contract } from './contract';

export const postsRouter = tsr.router(contract.posts, {
  getPosts: async () => {
    return {
      status: 200,
      body: {
        posts: [...],
      },
    };
  },
  createPost: async ({ body }) => {
    return { 
      status: 201,
      body: {
        post: { ... },
      },
    };
  },
});
```

Doing this however, you will lose any type-inference for the request object if you modify it in a global middleware.
To get around this, you can manually add back the extended part in the generics of `tsr.router` function.

```typescript
import { tsr } from '@ts-rest/serverless/aws';
import { contract } from './contract';

export const postsRouter = tsr.router<
  typeof contract,   // <-- You have to add the contract type here
  { userId: string } // <-- Add the extended part here. This will be visible in request.userId
>(contract, { ... });
```
## Context Object

The second argument for all route handlers is an object that contains the following context properties:

- `appRoute`: A reference to the contract route that the handler is being called for.
- `request`: The incoming request object.
- `responseHeaders`: An object, where you can set and append any headers that will be sent with the response.

It may also include runtime or platform-specific properties, like `rawEvent` and `lambdaContext` for AWS Lambda.

This object is also passed as the last argument to all middleware and response handler functions.
