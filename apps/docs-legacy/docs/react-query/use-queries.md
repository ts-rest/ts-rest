# useQueries

You can also fetch multiple queries at once using `useQueries` or `useSuspenseQueries`. It can be useful for fetching multiple queries, usually from the same endpoint.

ts-rest currently does not support multiple queries from different endpoints. While it is an uncommon use case, we are open to implementing it in the future.

```tsx
import { tsr } from './tsr';

const Posts = ({ ids }: { ids: string[] }) => {
  const { data, pending } = tsr.posts.get.useQueries({
    queries: ids.map((id) => ({
      queryKey: ['posts', id],
      queryData: {
        params: { id }
      },
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data),
        pending: results.some((result) => result.isPending),
      }
    },
  });
  
  if (pending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {queries.map((query) => (
        <p key={query.data?.body.id}>{query.data?.body.title}</p>
      ))}
    </div>
  );
};
```

See the [official `useQueries()` docs](https://tanstack.com/query/v5/docs/react/reference/useQueries) for more information.
