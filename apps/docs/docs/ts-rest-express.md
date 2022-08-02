---
title: '@ts-rest/express'
sidebar_position: 6
---

# Express Server

:::caution

The Express implementation is a work in progress, it's missing

- Body and Query Parsing

:::

```typescript
const s = initServer();

const router = s.router(router, {
  getPost: async ({ params: { id } }) => {
    const post = prisma.post.findUnique({ where: { id } });

    return post ?? null;
  },
});

createExpressEndpoints(router, completeRouter, app);
```

`createExpressEndpoints` is a function that takes a router and a complete router, and creates endpoints, with the correct methods, paths and callbacks.
