# React Query

This is a client using` @ts-react/react-query`, using `@tanstack/react-query` under the hood.

## useQuery and useMutation

```tsx
export const client = initQueryClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

const App = () => {
  // Effectively a useQuery hook
  const { data, isLoading, error } = client.posts.get.useQuery(['posts']);

  // Effectively a useMutation hook
  const { mutate, isLoading } = client.posts.create.useMutation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (data?.status !== 200) {
    return <div>Error</div>;
  }

  return (
    <div>
      {data.body.map((post) => (
        <p key={post.id}>post.title</p>
      ))}
    </div>
  );
};
```

### JSON Query Parameters

To enable encoding query parameters as typed JSON values, you can use the `jsonQuery` option.

```typescript
export const client = initQueryClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
  jsonQuery: true,
});
```

## Regular Query and Mutations

`@ts-rest/react-query` allows for a regular fetch or mutation if you want, without having to initialise two different clients, one with `@ts-rest/core` and one with `@ts-react/react-query`.

```typescript
// Normal fetch
const { body, status } = await client.posts.get.query();

// useQuery hook
const { data, isLoading } = client.posts.get.useQuery();
```

## useInfiniteQuery

One fantastic feature of `react-query` is the ability to create infinite queries. This is a great way to handle pagination.

[Prisma's Docs](https://www.prisma.io/docs/concepts/components/prisma-client/pagination) explain the concepts of cursor and offset pagination fantastically, especially if you use Prisma client with `@ts-rest`

### Cursor Pagination

This is a simple cursor based pagination example,

```typescript
const { isLoading, data, hasNextPage, fetchNextPage } = useInfiniteQuery(
  queryKey,
  ({ pageParam = 1 }) => pageParam,
  {
    getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
  }
);
```

### Offset Pagination

This example specifically uses an API with `skip` and `take` query parameters, so this is requires slightly more configuration than a regular query (hence the complicated looking getNextPageParam)

```tsx
const PAGE_SIZE = 5;

export function Index() {
  const { isLoading, data, hasNextPage, fetchNextPage } =
    client.getPosts.useInfiniteQuery(
      ['posts'],
      ({ pageParam = { skip: 0, take: PAGE_SIZE } }) => ({
        query: { skip: pageParam.skip, take: pageParam.take },
      }),
      {
        getNextPageParam: (lastPage, allPages) =>
          lastPage.status === 200
            ? lastPage.body.count > allPages.length * PAGE_SIZE
              ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
              : undefined
            : undefined,
      }
    );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No posts found</div>;
  }

  const posts = data.pages.flatMap((page) =>
    page.status === 200 ? page.body.posts : []
  );

  //...
}
```
