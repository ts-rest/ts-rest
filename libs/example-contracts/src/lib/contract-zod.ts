import { initTsRest } from '@ts-rest/core';
import { z } from 'zod';

const c = initTsRest();

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  published: z.boolean(),
  authorId: z.string(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
});

export const router = c.router({
  users: c.router({
    getUsers: c.query({
      method: 'GET',
      path: () => '/users',
      response: UserSchema.array(),
      query: null,
      summary: 'Get all users',
    }),
  }),
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: PostSchema.nullable(),
      query: null,
      summary: 'Get a post by id',
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: PostSchema.array(),
      query: z.object({
        take: z.string().transform(Number).optional(),
        skip: z.string().transform(Number).optional(),
      }),
      summary: 'Get all posts',
    }),
    createPost: c.mutation({
      method: 'POST',
      path: () => '/posts',
      response: PostSchema,
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
      response: PostSchema,
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
      response: z.boolean(),
      body: null,
      summary: 'Delete a post',
    }),
    deletePostComment: c.mutation({
      method: 'DELETE',
      path: ({ id, commentId }: { id: string; commentId: string }) =>
        `/posts/${id}/comments/${commentId}`,
      response: z.boolean(),
      body: null,
      summary: 'Delete a comment from a post',
      deprecated: true,
    }),
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: z.object({ message: z.string() }),
    query: null,
  }),
});
