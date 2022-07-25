import { initTsCont } from '@tscont/ts-rest-core';
import { z } from 'zod';

const c = initTsCont();

export type Post = {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
  authorId: string;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
};

// Three endpoints, two for posts, and one for health
export const router = c.router({
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }) => `/posts/${id}`,
      response: c.response<Post | null>(),
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
    createPost: c.mutation({
      method: 'POST',
      path: () => '/posts',
      response: c.response<Post>(),
      body: z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
      }),
    }),
    deletePost: c.mutation({
      method: 'DELETE',
      path: ({ id }) => `/posts/${id}`,
      response: c.response<boolean>(),
      body: null,
    }),
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: c.response<{ message: string }>(),
  }),
});
