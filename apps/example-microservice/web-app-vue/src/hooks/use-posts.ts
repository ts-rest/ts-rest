import { computed, MaybeRef, unref } from 'vue';
import { useClient } from '../api/client';

export const usePosts = (options?: {
  skip?: MaybeRef<number>;
  take?: MaybeRef<number>;
}) => {
  const queryKey = ['posts', options?.skip, options?.take] as const;
  const client = useClient();

  const posts = client.getPosts.useQuery({
    queryKey,
    queryData: {
      query: {
        skip: computed(() => (unref(options?.skip) ?? 20).toString()),
        take: computed(() => (unref(options?.take) ?? 0).toString()),
      },
    },
  });

  const { mutateAsync: createPost } = client.createPost.useMutation({
    onSuccess: () => posts.refetch(),
  });

  const { mutateAsync: deletePost } = client.deletePost.useMutation({
    onSuccess: () => posts.refetch(),
  });

  const lastPostId = computed(() => posts.data.value?.body.posts.at(-1)?.id);

  return { queryKey, posts, createPost, deletePost, lastPostId };
};
