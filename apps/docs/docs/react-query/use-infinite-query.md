# useInfiniteQuery

For infinite query hooks such as `useInfiniteQuery` and `useSuspenseInfiniteQuery`, `queryData` should be a function that maps a context object containing `pageParam` to the actual query data.

```tsx
import { tsr } from './tsr';

const PAGE_SIZE = 5;

export const Posts = () => {
  const { data, isLoading, isError, fetchNextPage, hasNextPage } = tsr.getPosts.useInfiniteQuery({
    queryKey: ['posts'],
    queryData: ({ pageParam }) => ({
      query: {
        skip: pageParam.skip,
        take: pageParam.take,
      },
    }),
    initialPageParam: { skip: 0, take: PAGE_SIZE },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.body.posts.length >= PAGE_SIZE
        ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
        : undefined;
    },
  });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (isError) {
    return <div>Error</div>;
  }

  const posts = data.pages.flatMap((page) =>
    page.status === 200 ? page.body.posts : [],
  );
  
  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button onClick={fetchNextPage}>Load more</button>
    </div>
  );
};
```

See the [official `useInfiniteQuery()` docs](https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery) for more information.

## QueryClient Methods

You can also use `fetchInfiniteQuery` and `prefetchInfiniteQuery` on the ts-rest extended `QueryClient`.

These will take the same arguments as `fetchQuery`, but need to specify an `initialPageParam` in order to correctly put the data in the cache with its corresponding `pageParam`.

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { tsr } from './tsr';

export default async function Page() {
  const tsrQueryClient = tsr.initQueryClient(new QueryClient());
  
  const initialPageParam = { skip: 0, take: 10 };
  await tsrQueryClient.getPosts.prefetchInfiniteQuery({
    queryKey: ['posts'],
    queryData: {
      query: initialPageParam,
    },
    initialPageParam,
  });

  return (
    <main>
      <HydrationBoundary state={dehydrate(tsrQueryClient)}>
        <Posts />
      </HydrationBoundary>
    </main>
  );
}
```
