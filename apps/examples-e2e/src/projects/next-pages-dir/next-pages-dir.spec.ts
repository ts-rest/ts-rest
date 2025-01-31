import { apiBlog } from '@ts-rest-examples/contracts';
import { initClient } from '@ts-rest/core';
import { describe, inject } from 'vitest';

const client = initClient(apiBlog, {
  baseUrl: `http://localhost:${inject('port')}/api`,
});

describe('next-pages-dir', () => {
  beforeEach(async () => {
    await client.deletePost({
      params: { id: 'all' },
      headers: { 'x-api-key': 'foo' },
    });
  });

  describe('POST /posts', () => {
    it('should create a post', async () => {
      const { headers, ...response } = await client.createPost({
        body: {
          title: 'Title',
          content: 'content',
        },
        headers: {
          'x-api-key': 'foo',
        },
      });

      expect(response).toEqual({
        status: 201,
        body: {
          id: expect.any(String),
          title: 'Title',
          content: 'content',
          description: null,
          published: false,
        },
      });
    });

    it('should transform body correctly', async () => {
      const { headers, ...response } = await client.createPost({
        headers: {
          'x-api-key': 'foo',
        },
        body: {
          title: 'Title with extra spaces     ',
          content: 'content',
        },
      });

      expect(response).toEqual({
        status: 201,
        body: {
          id: expect.any(String),
          title: 'Title with extra spaces',
          content: 'content',
          description: null,
          published: false,
        },
      });
    });

    it('should error if body is incorrect', async () => {
      const { headers, ...response } = await client.createPost({
        body: {
          title: 'Good title',
          // @ts-expect-error - this should be a string
          content: 123,
        },
        headers: {
          'x-api-key': 'foo',
        },
      });

      expect(response).toEqual({
        status: 400,
        body: {
          issues: [
            {
              code: 'invalid_type',
              expected: 'string',
              message: 'Expected string, received number',
              path: ['content'],
              received: 'number',
            },
          ],
          name: 'ZodError',
        },
      });
    });
  });

  describe('GET /posts', () => {
    it('should return an array of empty posts', async () => {
      const { headers, ...response } = await client.getPosts({
        query: {
          skip: 0,
          take: 10,
        },
        headers: {
          'x-api-key': 'foo',
          'x-pagination': 5,
        },
      });

      expect(response).toEqual({
        status: 200,
        body: {
          posts: [],
          count: 0,
          skip: 0,
          take: 10,
        },
      });
    });

    it('should return posts after creation', async () => {
      await client.createPost({
        body: {
          title: 'Title',
          content: 'content',
        },
        headers: {
          'x-api-key': 'foo',
        },
      });

      const { headers, ...response } = await client.getPosts({
        query: {
          skip: 0,
          take: 10,
        },
        headers: {
          'x-api-key': 'foo',
          'x-pagination': 5,
        },
      });

      expect(response).toEqual({
        status: 200,
        body: {
          posts: [
            {
              id: expect.any(String),
              title: 'Title',
              content: 'content',
              description: null,
              published: false,
            },
          ],
          count: 1,
          skip: 0,
          take: 10,
        },
      });
    });

    it('should error on invalid pagination header', async () => {
      const { headers, ...response } = await client.getPosts({
        query: {
          skip: 0,
          take: 10,
        },
        headers: {
          'x-api-key': 'foo',
          // @ts-expect-error - this should be a number
          'x-pagination': 'not a number',
        },
      });

      expect(response).toEqual({
        status: 400,
        body: {
          issues: [
            {
              code: 'invalid_type',
              expected: 'number',
              message: 'Expected number, received nan',
              path: ['x-pagination'],
              received: 'nan',
            },
          ],
          name: 'ZodError',
        },
      });
    });

    it('should error if a required query param is missing', async () => {
      const { headers, ...response } = await client.getPosts({
        // @ts-expect-error - missing take param
        query: {
          skip: 0,
        },
        headers: {
          'x-api-key': 'foo',
        },
      });

      expect(response).toEqual({
        status: 400,
        body: {
          issues: [
            {
              code: 'invalid_type',
              expected: 'number',
              message: 'Expected number, received nan',
              path: ['take'],
              received: 'nan',
            },
          ],
          name: 'ZodError',
        },
      });
    });
  });

  it('should error if api key header is missing', async () => {
    const { headers, ...response } = await client.getPosts({
      query: {
        skip: 0,
        take: 10,
      },
      // @ts-expect-error - missing api key
      headers: {
        'x-pagination': 5,
      },
    });

    expect(response).toEqual({
      status: 400,
      body: {
        issues: [
          {
            code: 'invalid_type',
            expected: 'string',
            message: 'Required',
            path: ['x-api-key'],
            received: 'undefined',
          },
        ],
        name: 'ZodError',
      },
    });
  });

  it('should format params using pathParams correctly', async () => {
    const { headers, ...response } = await client.testPathParams({
      params: {
        id: 123,
        name: 'name',
      },
      headers: {
        'x-api-key': 'foo',
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        id: 123,
        name: 'name',
        defaultValue: 'hello world',
      },
    });
  });
});
