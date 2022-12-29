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

## Future Work

As this pattern doesn't support a lambda per endpoint, it is planned to provide a helper utility to allow individual endpoints to be created.

The downside of this is that it will not be possible to give a Typescript warning if the path is incorrect.
