import { createApp } from 'vue';
import App from './App.vue';
import { TsRestPlugin, useClient } from './api/client';
import { createRouter, createWebHistory } from 'vue-router';
import { apiBlog } from '@ts-rest/example-contracts';
import { z } from 'zod';

const PostSchema = apiBlog.getPost.responses[200]
  .omit({ id: true })
  .merge(
    z.object({ published: z.string().or(z.boolean()).transform(Boolean) }),
  );

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./components/Posts.vue') },
    { path: '/infinite', component: () => import('./components/Infinite.vue') },
    {
      path: '/posts/:id',
      name: 'single-post',
      component: () => import('./components/Post.vue'),
      // pass query params as props to page-component
      props: (route) => ({
        id: route.params.id,
        ...route.query,
      }),
      beforeEnter: async (to, _from, next) => {
        if (PostSchema.safeParse(to.query).success) return next(true); // prevent infinite-loop

        const post = await useClient().getPost.query({
          params: { id: to.params.id as string },
        });

        if (post.status !== 200) return next(false); // redirect to error page

        const { id, ...body } = post.body;

        return next({
          ...to,
          query: { ...to.query, ...body },
        });
      },
    },
  ],
});

createApp(App).use(TsRestPlugin).use(router).mount('#app');
