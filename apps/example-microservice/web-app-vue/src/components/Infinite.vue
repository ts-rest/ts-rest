<template>
  <section>
    <h2>Infinite query posts</h2>

    <Post v-for="post in posts" :key="post.id" v-bind="post" with-delete></Post>

    <div class="actions">
      <div>
        posts: {{ posts.length }} | hasNext: {{ hasNextPage ? '✅' : '❌' }}
      </div>
      <button
        :disabled="!hasNextPage"
        @click="fetchNextPage().then(scrollToBottom)"
      >
        load more
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useInfinitePosts } from '../hooks/use-infinite-posts';
import Post from './Post.vue';

const { posts, fetchNextPage, hasNextPage } = useInfinitePosts();

const scrollToBottom = () =>
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
</script>

<style scoped>
.actions {
  justify-content: space-between;
}
</style>
