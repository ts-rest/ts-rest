import { initContract } from '@ts-rest/core';

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
      201: c.response<PostTs>(),
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
      200: c.response<PostTs>(),
      404: c.response<null>(),
    },
    query: null,
    summary: 'Get a post by id',
  },
});
