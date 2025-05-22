<template>
  <section>
    <h2>Posts</h2>

    <div v-if="posts.isFetching.value">Loading...</div>
    <div v-if="posts.error.value">Error: {{ posts.error.value }}</div>

    <pre v-if="posts.data.value?.body && posts.isSuccess.value">{{
      posts.data.value?.body
    }}</pre>

    Last post:
    <Post
      v-if="lastPost?.body"
      v-bind="lastPost.body"
      @update="handleUpdate($event)"
    />

    <div class="actions">
      <button
        @click="
          createPost({
            body: { title: `Created Post ${++count}`, content: 'A new post' },
          })
        "
      >
        Create Post
      </button>
      <button
        v-if="lastPostId"
        @click="deletePost({ params: { id: lastPostId } })"
      >
        Delete Post
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ComputedRef, computed } from 'vue';
import type { Post as PostDto } from '@ts-rest/example-contracts';

import { useClient, useQueryClient } from '../api/client';
import { usePosts } from '../hooks/use-posts';

import Post from './Post.vue';

const queryClient = useQueryClient();

let count = 0;
const { queryKey, posts, createPost, deletePost, lastPostId } = usePosts({
  skip: 0,
  take: -3,
});

const { data: lastPost } = useClient().getPost.useQuery({
  queryKey: ['posts', lastPostId] as const,
  queryData: { params: { id: lastPostId as ComputedRef<string> } },
  enabled: computed(() => !!lastPostId.value),
});

const handleUpdate = (post: PostDto) => {
  queryClient.getPosts.setQueryData(queryKey, (cache) =>
    cache
      ? {
          ...cache,
          body: {
            ...cache.body,
            posts: cache.body.posts.slice(0, -1).concat(post),
          },
        }
      : cache,
  );
};
</script>
