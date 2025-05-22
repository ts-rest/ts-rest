<template>
  <div class="post">
    <RouterLink :to="{ name: 'single-post', params: { id } }">
      <h4>{{ title }} | {{ id }}</h4>
    </RouterLink>

    <p>{{ content }}</p>

    <label for="published">Published:</label>
    <input id="published" type="checkbox" v-model="published" />

    <pre v-if="data">{{ data.body }}</pre>

    <div class="actions">
      <button
        @click="
          mutateUpdate({
            params: { id: props.id },
            body: updatedPost,
          })
        "
      >
        Save
      </button>
      <button v-if="withDelete" @click="deletePost(id)">Delete</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, toRefs, watchEffect } from 'vue';
import type { Post } from '@ts-rest/example-contracts';

import { useClient } from '../api/client';

type Props = Post & { withDelete?: boolean };

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [id: Post];
  delete: [id: Post['id']];
}>();

const { published: publishedProp } = toRefs(props);
const published = ref(publishedProp.value);

watchEffect(() => (published.value = publishedProp.value));

const updatedPost = computed(() => ({
  title: props.title,
  content: props.content ?? undefined,
  description: props.description ?? undefined,
  published: published.value,
}));

const { mutate: mutateUpdate, data } = useClient().updatePost.useMutation({
  onSuccess: (response) => emit('update', response.body),
});
const { mutate: mutateDelete } = useClient().deletePost.useMutation();

const deletePost = (id: string) => {
  mutateDelete({ params: { id } }, { onSuccess: () => emit('delete', id) });
};
</script>

<style scoped>
.post {
  border: 1px solid black;
  padding: 1rem;
  margin: 1rem 0;
}
</style>
