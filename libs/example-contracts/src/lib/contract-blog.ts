import { initClient, initTsRest } from '@ts-rest/core';
import { z } from 'zod';

export interface Post {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  published: boolean;
  tags: string[];
}
const c = initTsRest();

export const apiBlog = c.router({
  createPost: c.mutation({
    method: 'POST',
    path: () => '/posts',
    responses: {
      201: c.response<Post>(),
    },
    body: z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean().optional(),
      description: z.string().optional(),
    }),
    summary: 'Create a post',
  }),
  updatePost: c.mutation({
    method: 'PATCH',
    path: ({ id }: { id: string }) => `/posts/${id}`,
    responses: { 200: c.response<Post>() },
    body: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      published: z.boolean().optional(),
      description: z.string().optional(),
    }),
    summary: 'Update a post',
  }),
  deletePost: c.mutation({
    method: 'DELETE',
    path: ({ id }: { id: string }) => `/posts/${id}`,
    responses: {
      200: c.response<{ message: string }>(),
      404: c.response<{ message: string }>(),
    },
    body: null,
    summary: 'Delete a post',
  }),
  getPost: c.query({
    method: 'GET',
    path: ({ id }: { id: string }) => `/posts/${id}`,
    responses: { 200: c.response<Post>(), 404: c.response<null>() },
    query: null,
    summary: 'Get a post by id',
  }),
  getPosts: c.query({
    method: 'GET',
    path: () => '/posts',
    responses: {
      200: c.response<{ posts: Post[]; total: number }>(),
    },
    query: z.object({
      take: z.string().transform(Number).optional(),
      skip: z.string().transform(Number).optional(),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
  }),
});
