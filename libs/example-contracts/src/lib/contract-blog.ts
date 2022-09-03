import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export interface Post {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  published: boolean;
  tags: string[];
}

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  published: z.boolean(),
  tags: z.array(z.string()),
});

const c = initContract();

export const apiBlog = c.router({
  createPost: {
    method: 'POST',
    path: '/posts',
    responses: {
      201: PostSchema,
    },
    body: z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean().optional(),
      description: z.string().optional(),
    }),
    summary: 'Create a post',
  },
  updatePost: {
    method: 'PATCH',
    path: `/posts/:id`,
    responses: { 200: PostSchema },
    body: z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      published: z.boolean().optional(),
      description: z.string().optional(),
    }),
    summary: 'Update a post',
  },
  deletePost: {
    method: 'DELETE',
    path: `/posts/:id`,
    responses: {
      200: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    body: null,
    summary: 'Delete a post',
  },
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: PostSchema,
      404: z.null(),
    },
    query: null,
    summary: 'Get a post by id',
  },
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: z.object({
        posts: PostSchema.array(),
        count: z.number(),
        skip: z.number(),
        take: z.number(),
      }),
    },
    query: z.object({
      take: z.string().transform(Number),
      skip: z.string().transform(Number),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
  },
});
