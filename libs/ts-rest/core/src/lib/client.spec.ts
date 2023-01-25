import * as fetchMock from 'fetch-mock-jest';
import { initContract } from '..';
import { initClient } from './client';

import { z } from 'zod';

const c = initContract();

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

const postsRouter = c.router({
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: c.response<Post | null>(),
    },
  },
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.response<Post[]>(),
    },
    query: z.object({
      take: z.number().optional(),
      skip: z.number().optional(),
      order: z.string().optional(),
    }),
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    responses: {
      200: c.response<Post>(),
    },
    body: z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean().optional(),
      description: z.string().optional(),
      authorId: z.string(),
    }),
  },
  mutationWithQuery: {
    method: 'POST',
    path: '/posts',
    responses: {
      200: c.response<Post>(),
    },
    body: z.object({}),
    query: z.object({
      test: z.string(),
    }),
  },
  updatePost: {
    method: 'PUT',
    path: `/posts/:id`,
    responses: {
      200: c.response<Post>(),
    },
    body: z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean().optional(),
      description: z.string().optional(),
      authorId: z.string(),
    }),
  },
  patchPost: {
    method: 'PATCH',
    path: `/posts/:id`,
    responses: {
      200: c.response<Post>(),
    },
    body: null,
  },
  deletePost: {
    method: 'DELETE',
    path: `/posts/:id`,
    responses: {
      200: c.response<boolean>(),
    },
    body: null,
  },
});

// Three endpoints, two for posts, and one for health
export const router = c.router({
  posts: postsRouter,
  health: {
    method: 'GET',
    path: '/health',
    responses: {
      200: c.response<{ message: string }>(),
    },
  },
  upload: {
    method: 'POST',
    path: '/upload',
    body: c.body<{ file: File }>(),
    responses: {
      200: c.response<{ message: string }>(),
    },
    contentType: 'multipart/form-data',
  },
});

const client = initClient(router, {
  baseUrl: 'https://api.com',
  baseHeaders: {},
});

describe('client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe('get', () => {
    it('w/ no parameters', async () => {
      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPosts({});

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ no query parameters', async () => {
      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPosts({ query: {} });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ no parameters (not provided)', async () => {
      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPosts();

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ query parameters', async () => {
      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts?take=10',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPosts({ query: { take: 10 } });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ json query parameters', async () => {
      const client = initClient(
        {
          ...router,
          posts: {
            ...router.posts,
            getPosts: {
              ...router.posts.getPosts,
              query: router.posts.getPosts.query.extend({
                published: z.boolean(),
                filter: z.object({
                  title: z.string(),
                }),
              }),
            },
          },
        },
        {
          baseUrl: 'https://api.com',
          baseHeaders: {},
          jsonQuery: true,
        }
      );

      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: `https://api.com/posts?take=10&order=asc&published=true&filter=${encodeURIComponent(
            '{"title":"test"}'
          )}`,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPosts({
        query: {
          take: 10,
          order: 'asc',
          published: true,
          filter: { title: 'test' },
        },
      });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ undefined query parameters', async () => {
      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts?take=10',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPosts({
        query: { take: 10, skip: undefined },
      });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ sub path', async () => {
      const value = { key: 'value' };
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts/1',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.getPost({ params: { id: '1' } });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ a non json response (string)', async () => {
      fetchMock.getOnce(
        {
          url: 'https://api.com/posts',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          body: 'string',
          status: 200,
        }
      );

      const result = await client.posts.getPosts({});

      expect(result).toStrictEqual({ body: 'string', status: 200 });
    });
  });

  describe('post', () => {
    it('w/ body', async () => {
      const value = { key: 'value' };
      fetchMock.postOnce(
        {
          url: 'https://api.com/posts',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.createPost({
        body: { title: 'title', content: 'content', authorId: 'authorId' },
      });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });

    it('w/ query params', async () => {
      fetchMock.postOnce(
        {
          url: 'https://api.com/posts?test=test',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {},
        },
        { body: {}, status: 200 }
      );

      const result = await client.posts.mutationWithQuery({
        query: { test: 'test' },
        body: {},
      });

      expect(result).toStrictEqual({ body: {}, status: 200 });
    });
  });

  describe('put', () => {
    it('w/ sub path and body', async () => {
      const value = { key: 'value' };
      fetchMock.putOnce(
        {
          url: 'https://api.com/posts/1',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            title: 'title',
            content: 'content',
            authorId: 'authorId',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.updatePost({
        params: { id: '1' },
        body: { title: 'title', content: 'content', authorId: 'authorId' },
      });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });
  });

  describe('patch', () => {
    it('w/ body', async () => {
      const value = { key: 'value' };
      fetchMock.patchOnce(
        {
          url: 'https://api.com/posts/1',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.patchPost({
        params: { id: '1' },
        body: null,
      });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });
  });

  describe('delete', () => {
    it('w/ body', async () => {
      const value = { key: 'value' };
      fetchMock.deleteOnce(
        {
          url: 'https://api.com/posts/1',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        { body: value, status: 200 }
      );

      const result = await client.posts.deletePost({
        params: { id: '1' },
        body: null,
      });

      expect(result).toStrictEqual({ body: value, status: 200 });
    });
  });

  describe('multipart/form-data', () => {
    it('w/ body', async () => {
      const value = { key: 'value' };
      fetchMock.postOnce(
        {
          url: 'https://api.com/upload',
        },
        { body: value, status: 200 }
      );

      const file = new File([''], 'filename', { type: 'text/plain' });

      const result = await client.upload({
        body: { file },
      });

      expect(result).toStrictEqual({ body: value, status: 200 });

      expect(fetchMock).toHaveLastFetched(true, {
        matcher: (_, options) => {
          const formData = options.body as FormData;
          return formData.get('file') === file;
        },
      });
    });

    it('w/ FormData', async () => {
      const value = { key: 'value' };
      fetchMock.postOnce(
        {
          url: 'https://api.com/upload',
        },
        { body: value, status: 200 }
      );

      const formData = new FormData();
      formData.append('test', 'test');

      const result = await client.upload({
        body: formData,
      });

      expect(result).toStrictEqual({ body: value, status: 200 });

      expect(fetchMock).toHaveLastFetched(true, {
        matcher: (_, options) => {
          const formData = options.body as FormData;
          return formData.get('test') === 'test';
        },
      });
    });
  });
});
