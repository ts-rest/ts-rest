# Express Server

```typescript
const s = initServer();

const router = s.router(router, {
  getPost: async ({ params: { id } }) => {
    const post = prisma.post.findUnique({ where: { id } });

    return {
      status: 200,
      body: post ?? null,
    };
  },
});

createExpressEndpoints(router, completeRouter, app);
```

`createExpressEndpoints` is a function that takes a router and a complete router, and creates endpoints, with the correct methods, paths and callbacks.

### JSON Query Parameters

To handle JSON query parameters, you can use the `jsonQuery` option.

```typescript
createExpressEndpoints(router, completeRouter, app, { jsonQuery: true });
```
