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

export const router = c.router({
  users: c.router({
    getUsers: c.query({
      method: 'GET',
      path: () => '/users',
      response: c.response<User[]>(),
      query: null,
      summary: 'Get all users',
    }),
  }),
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post | null>(),
      query: null,
      summary: 'Get a post by id',
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
      query: z.object({
        take: z.string().transform(Number).optional(),
        skip: z.string().transform(Number).optional(),
      }),
      summary: 'Get all posts',
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
      summary: 'Create a post',
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
      summary: 'Update a post',
    }),
    deletePost: c.mutation({
      method: 'DELETE',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<boolean>(),
      body: null,
      summary: 'Delete a post',
    }),
    deletePostComment: c.mutation({
      method: 'DELETE',
      path: ({ id, commentId }: { id: string; commentId: string }) =>
        `/posts/${id}/comments/${commentId}`,
      response: c.response<boolean>(),
      body: null,
      summary: 'Delete a comment from a post',
      deprecated: true,
    }),
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: c.response<{ message: string }>(),
    query: null,
  }),
});
