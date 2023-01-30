# Next.js Server

For maximum type safety, by default `@ts-rest/next` uses a single endpoint for all routes.

:::info
It is possible to split out to multiple endpoints by having multiple [...ts-rest].tsx files in different folders, so long as the routers you use all begin with the same path e.g. all `/posts` endpoints in a posts folder.
:::

```typescript
// pages/api/[...ts-rest].tsx

const postsRouter = createNextRoute(api.posts, {
  createPost: async (args) => {
    const newPost = await posts.createPost(args.body);

    return {
      status: 201,
      body: newPost,
    };
  },
});

const router = createNextRoute(api, {
  posts: postsRouter,
});

// Actually initiate the collective endpoints
export default createNextRouter(api, router);
```

`createNextRouter` is a function that takes a router and a complete router, and creates endpoints, with the correct methods, paths and callbacks.

### JSON Query Parameters

To handle JSON query parameters, you can use the `jsonQuery` option.

```typescript
export default createNextRouter(api, router, { jsonQuery: true });
```

### Response Validation

To enable response parsing and validation, you can use the `validateResponses` option.
If there is a corresponding response Zod schema defined in the contract for the returned status code, the response will be parsed and validated.
If validation fails a `ResponseValidationError` will be thrown causing a 500 response to be returned.

```typescript
export default createNextRouter(api, router, { validateResponses: true });
```

### Error Handling

You can create a global error handler to handle any thrown errors by using the `errorHandler` option.
This includes response validation errors.

```typescript
export default createNextRouter(api, router, {
  responseValidation: true,
  errorHandler: (error: unknown, req: NextApiRequest, res: NextApiResponse) => {
    if (error instanceof ResponseValidationError) {
      console.log(error.cause);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
});
```


## Future Work

As this pattern doesn't support a lambda per endpoint, it is planned to provide a helper utility to allow individual endpoints to be created.

The downside of this is that it will not be possible to give a Typescript warning if the path is incorrect.
