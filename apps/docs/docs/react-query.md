# React Query

This is a client using` @ts-react/react-query`, using `@tanstack/react-query` under the hood.

```tsx
export const client = initReactQueryClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

const App = () => {
  // Effectively a useQuery hook
  const { data, isLoading } = client.posts.get.useQuery(['posts']);

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

## Regular Query and Mutations

`@ts-rest/react-query` allows for a regular fetch or mutation if you want, without having to initialise two different clients, one with `@ts-rest/core` and one with `@ts-react/react-query`.

```typescript
// Normal fetch
const { data } = await client.posts.get.query();

// useQuery hook
const { data, isLoading } = client.posts.get.useQuery();
```
