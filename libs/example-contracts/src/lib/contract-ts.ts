import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export interface PostTs {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  published: boolean;
  tags: string[];
}

const c = initContract();

export const contractTs = c.router({
  createPost: {
    method: 'POST',
    path: '/ts/posts',
    responses: {
      201: c.type<PostTs>(),
    },
    body: c.body<{
      title: string;
      content: string;
      published?: boolean;
    }>(),
    summary: 'Create a post',
  },
  getPost: {
    method: 'GET',
    path: `/ts/posts/:id`,
    responses: {
      200: c.type<PostTs>(),
      404: c.type<null>(),
    },
    query: null,
    summary: 'Get a post by id',
  },
  getPosts: {
    method: 'GET',
    path: `/ts/posts`,
    responses: {
      200: c.type<{
        posts: PostTs[];
        count: number;
        skip: number;
        take: number;
      }>(),
    },
    query: z.object({
      take: z.number().optional(),
      skip: z.number().optional(),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
  },
});
