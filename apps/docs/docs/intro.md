# Introduction

ts-rest offers a simple way to define a contract for your API, which can be both consumed and implemented by your application, giving you end to end type safety without the hassle or code generation.

### Features

- End to end type safety 🛟
- RPC-like client side interface 📡
- [Tiny bundle size 🌟](https://bundlephobia.com/package/@ts-rest/core) (1kb!)
- Well-tested and production ready ✅
- No Code Generation 🏃‍♀️
- Zod support for runtime type checks 👮‍♀️
- Full optional OpenAPI integration 📝

### Super Simple Example

Easily define your API contract somewhere shared

```typescript
const contract = c.contract({
  getPosts: {
    method: 'GET',
    path: '/posts',
    query: z.object({
      skip: z.number(),
      take: z.number(),
    }), // <-- Zod schema
    responses: {
      200: c.response<Post[]>(), // <-- OR normal TS types
    },
    headers: z.object({
      'x-pagination-page': z.coerce.number().optional(),
    }),
  },
});
```

Fulfil the contract on your sever, with a type-safe router:

```typescript
const router = s.router(contract, {
  getPost: async ({ params: { id } }) => {
    return {
      status: 200,
      body: prisma.post.findUnique({ where: { id } }),
    };
  },
});
```

Consume the api on the client with a RPC-like interface:

```typescript
const result = await client.getPosts({
  headers: { 'x-pagination-page': 1 },
  query: { skip: 0, take: 10 },
  // ^-- Fully typed!
});
```
