# React Query

This is a client using` @ts-react/react-query`, using `@tanstack/react-query` under the hood.

## initQueryClient

The below snippet is how you'd create a query client, this is pretty much the same structure as the `@ts-rest/core` client.

```tsx
export const client = initQueryClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
  api?: () => ... // <- Optional Custom API Fetcher (see below)
});
```

To customise the API, follow the same docs as the core client [here](/docs/core/custom)

:::tip

By default, ts-rest encodes query parameters as regular URL encoded strings (with support for nested objects, arrays etc) with full decode compatibility from [`qs`](https://www.npmjs.com/package/qs)

To encode query parameters as JSON, you can use the `jsonQuery` option, please note you'll need to configure your backend to support decoding JSON query parameters.

```tsx
export const client = initQueryClient(router, {
  ...,
  jsonQuery: true
});

```

:::

## useQuery and useMutation

Once you've created a client using `initQueryClient`, you may traverse the object (in the exact same structure as your contract layout) to find the query or mutation you want to use.

```tsx
const queryResult = client.posts.get.useQuery(
  ['posts'], // <- queryKey
  { params: { id: '1' } }, // <- Query params, Params, Body etc (all typed)
  { staleTime: 1000 } // <- react-query options (optional)
);
```

:::tip

The design philosophy of `@ts-rest/react-query` is to make it as easy as possible to use `react-query` with `@ts-rest`. This means that the `useQuery` and `useMutation` hooks are as close to the original `react-query` hooks as possible, as such we don't abstract away from the query keys or the options. Only the query function itself!

:::

```tsx
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

:::info

When destructing the response from `useQuery` or `useMutation`, remember that ts-rest returns a `status` and `body` property, so you'll need to destructure those as well.

The reason for this is error handling! Please see the [Relevant Docs](/docs/core/errors#client-error-typing)

:::

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

## useQueries

`useQueries` ([useQueries docs](https://tanstack.com/query/v4/docs/react/reference/useQueries)) is a great way to fetch multiple queries at once, or to dynamically fetch queries based on some condition. This is great because normally the number of useQuery hooks per component is fixed.

```tsx
const queries = client.posts.get.useQueries({
  queries: [
    // <- This queries array can be changed at runtime!
    {
      queryKey: ['posts', '1'],
      params: {
        id: '1',
      },
    },
    {
      queryKey: ['posts', '2'],
      params: {
        id: '2',
      },
    },
  ],
});

if (queries.some((query) => query.isLoading)) {
  return <div>Loading...</div>;
}

return (
  <div>
    {queries.map((query) => (
      <p key={query.data?.body.id}>{query.data?.body.title}</p>
    ))}
  </div>
);
```
