# Server Rendering

The common strategy to efficiently and optimally do server side rendering, as well as prevent request waterfalls on the client, is to do prefetching on the server,
then pass a dehydrated form of the query cache from the server to the client.

In these scenarios, the React Query code will not run inside a provider, so we need to initialize the `QueryClient` manually and pass it to ts-rest.

Therefore, instead of using `tsr.useQueryClient()` as you usually would in your components, use `tsr.initQueryClient(queryClient)` to pass your created `QueryClient` to ts-rest.

See the [`@tanstack/react-query` Server Rendering Guide](https://tanstack.com/query/v5/docs/framework/react/guides/ssr) for an in-depth guide on how to properly do server side rendering.

## Examples

### Next.js Pages Router

```tsx
// pages/posts.tsx
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { tsr } from './tsr';

export async function getServerSideProps() {
  const tsrQueryClient = tsr.initQueryClient(new QueryClient());

  await tsrQueryClient.getPosts.prefetchQuery({ queryKey: ['POSTS'] });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}
```

### React Server Components

```tsx
// app/posts/page.tsx
import { dehydrate, HydrationBoundary, QueryClient} from '@tanstack/react-query';
import { tsr } from './tsr';

export default async function PostsPage() {
  const tsrQueryClient = tsr.initQueryClient(new QueryClient()); // <-- or pass a QueryClient from anywhere depending on your needs

  await tsrQueryClient.getPosts.prefetchQuery({ queryKey: ['POSTS'] });

  return (
    <HydrationBoundary state={dehydrate(tsrQueryClient)}>
      <Posts />
    </HydrationBoundary>
  );
}
```
