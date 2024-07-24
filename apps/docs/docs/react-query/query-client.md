# QueryClient

In addition to the hooks provided, `@ts-rest/react-query` also provides an extended version of `QueryClient` that is fully type-safe.

It follows the same structure as your contract, and can be used the same way as the original `QueryClient` with similar function
signatures to the ts-rest hooks for functions such as `queryClient.fetchQuery` and it's respective `useQuery` hook.

```tsx
import { tsr } from './tsr';

const Posts = () => {
  const POSTS_QUERY_KEY = ['posts'];

  const tsrQueryClient = tsr.useQueryClient();
  const { data, isLoading } = tsr.posts.get.useQuery({ queryKey: POSTS_QUERY_KEY });
  const { mutate } = tsr.posts.create.useMutation();

  const createPost = async () => {
    return mutate(
      { body: { title: 'Hello World' } },
      {
        onSuccess: async (data) => {
          //  this is typed ^
          tsrQueryClient.posts.get.setQueryData(POSTS_QUERY_KEY, (oldPosts) => {
            //                                     this is also typed ^
            return {
              ...oldPosts,
              body: [...oldPosts.body, data.body],
            };
          });
        },
      },
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (data?.status !== 200) {
    return <div>Error</div>;
  }

  return (
    <div>
      <button onClick={createPost}>Create Post</button>
      {data.body.map((post) => (
        <p key={post.id}>post.title</p>
      ))}
    </div>
  );
};
```

## Non-Wrapped Functions

For functions that do not consume or provide typed data such as `queryClient.invalidateQueries()`, it makes no sense to wrap these and access them through an endpoint path such as `tsrQueryClient.posts.get.invalidateQueries()`.
As such, these functions are provided as-is at the root level of the `tsr.useQueryClient()` instance.

You can actually use the `QueryClient` returned from `tsr.useQueryClient()` anywhere you would normally use a `QueryClient` instance, as under the hood
we use the `QueryClient` returned from `useQueryClient()`, and we simply extend it with the ts-rest functions.

