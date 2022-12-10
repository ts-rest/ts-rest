import { createMocks } from 'node-mocks-http';

import tsRestEndpoint from '../pages/api/[...ts-rest]';
import { postsService } from '../server/posts';

jest.mock('../server/posts');

const getPosts = postsService.getPosts as jest.Mock;

describe('/posts', () => {
  beforeEach(() => {
    getPosts.mockClear();
  });

  it('returns a list of posts', async () => {
    getPosts.mockResolvedValueOnce({
      posts: [],
      count: 0,
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        'ts-rest': ['posts'],
        skip: '0',
        take: '10',
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await tsRestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      count: 0,
      skip: 0,
      take: 10,
      posts: [],
    });
  });

  it('transforms params correctly', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        'ts-rest': ['test', '123', 'test'],
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await tsRestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      id: 123,
      name: 'test',
    });
  });

  it('errors when zod validation fails', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: {
        'ts-rest': ['posts'],
      },
      body: {
        title: '123',
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await tsRestEndpoint(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Required',
          path: ['content'],
          received: 'undefined',
        },
      ],
      name: 'ZodError',
    });
  });
});
