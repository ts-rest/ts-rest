<template>
  <div class="App">
    <h1>Posts from posts-service</h1>

    <div v-if="isLoading">Loading...</div>

    <div v-if="error">Error: {{ error }}</div>

    <div v-if="data">
      <div v-for="post in data.body" :key="post.id">
        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { client } from './api/client';

const { data, error, isLoading } = client.getPosts.useQuery(['posts']);
</script>
