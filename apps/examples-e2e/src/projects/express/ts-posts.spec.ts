import { contractTs } from '@ts-rest-examples/contracts';
import { initClient } from '@ts-rest/core';
import { inject } from 'vitest';

const client = initClient(contractTs, {
  baseUrl: `http://localhost:${inject('port')}/api`,
});

describe('TS Blog', () => {
  it('GET /posts/123 should return a post', async () => {
    const { headers, ...response } = await client.getPost({
      params: {
        id: '123',
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        id: '123', // Not "123" as a number, because no Zod transform
        title: 'Post',
        content: 'Content',
        description: 'Description',
        published: true,
      },
    });
  });

  it('GET /posts should return posts with typed query params', async () => {
    const { headers, ...response } = await client.getPosts({
      query: {
        skip: 42,
        take: 100,
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        posts: expect.any(Array),
        count: 0,
        skip: 42,
        take: 100,
      },
    });
  });
});
