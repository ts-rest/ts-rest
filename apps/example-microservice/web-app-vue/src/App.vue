<template>
  <main>
    <h1>Posts from posts-service</h1>
    <VueQueryDevtools />

    <nav class="actions">
      <RouterLink to="/">Edit</RouterLink>
      <RouterLink to="/infinite">Infinite Query</RouterLink>
      <RouterLink :to="route" v-if="route.query.title">{{
        route.query.title
      }}</RouterLink>
    </nav>

    <RouterView />
  </main>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';

const route = useRoute();
</script>

<style>
main {
  max-width: 800px;
  margin: 0 auto;
}

section {
  margin: 8rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
}
</style>
