import { initTsRest } from '@ts-rest/core';
import { z } from 'zod';

const c = initTsRest();

export type Post = {
  id: string;
  title: string;
  description: string | null;
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
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post | null>(),
      query: null,
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
      query: z.object({
        take: z.string().transform(Number).optional(),
        skip: z.string().transform(Number).optional(),
      }),
    }),
    createPost: c.mutation({
      method: 'POST',
      path: () => '/posts',
      response: c.response<Post>(),
      body: z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
        description: z.string().optional(),
        authorId: z.string(),
      }),
    }),
    updatePost: c.mutation({
      method: 'PUT',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post>(),
      body: z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
        description: z.string().optional(),
      }),
    }),
    deletePost: c.mutation({
      method: 'DELETE',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<boolean>(),
      body: null,
    }),
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: c.response<{ message: string }>(),
    query: null,
  }),
});
