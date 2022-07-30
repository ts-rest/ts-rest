---
sidebar_position: 2
---

# Tutorial

## Contract Definition

Install `@ts-rest/core`, define a contract in a shared place or a shared package.

```typescript
const c = initContract();

export const contract = c.router({
  posts: c.router({
    get: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
    create: c.mutation({
      method: 'POST',
      path: () => '/posts',
      body: z.object({
        title: z.string(),
        content: z.string(),
      }),
      response: c.response<Post>(),
    }),
  }),
});
```

## Client

This is a basic client using `@ts-rest/core`, uses `fetch` under the hood.

```typescript
export const client = initClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

const { data } = await client.posts.get();

const { data } = await client.posts.create({
  body: {
    title: 'Hello',
    content: 'World',
  },
});
```

## Client (react-client)

This is a client using` @ts-react/react-query`, using `@tanstack/react-query` under the hood.

```tsx
export const client = initReactQueryClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

const App = () => {
  // Effectively a useQuery hook
  const { data, isLoading } = client.posts.get.useQuery();

  // Effectively a useMutation hook
  const { mutate, isLoading } = client.posts.create.useMutation();

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>{data.map((post) => post.title)}</div>
      )}
    </div>
  );
};
```

`@ts-rest/react-query` allows for a regular fetch or mutation if you want, without having to initialise two different clients, one with `@ts-rest/core` and one with `@ts-react/react-query`.

```typescript
// Normal fetch
const { data } = await client.posts.get.query();

// useQuery hook
const { data, isLoading } = client.posts.get.useQuery();
```
