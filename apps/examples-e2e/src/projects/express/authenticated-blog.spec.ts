import { apiBlog } from '@ts-rest-examples/contracts';
import { initClient } from '@ts-rest/core';
import jwt from 'jsonwebtoken';
import { inject } from 'vitest';

const client = initClient(apiBlog, {
  baseUrl: `http://localhost:${inject('port')}/api/internal`,
});

const JWT_SECRET = process.env.JWT_SECRET ?? '';

const SAMPLE_OWNER_JWT = jwt.sign(
  {
    id: 'mock-owner-id',
    role: 'user',
  },
  JWT_SECRET
);

const SAMPLE_NON_OWNER_JWT = jwt.sign(
  {
    id: 'mock-user-id',
    role: 'user',
  },
  JWT_SECRET
);

const SAMPLE_GUEST_JWT = jwt.sign(
  {
    id: 'mock-guest-id',
    role: 'guest',
  },
  JWT_SECRET
);

describe('Authenticated App Endpoints', () => {
  it('GET /posts should fail with invalid JWT', async () => {
    const { headers, ...response } = await client.getPosts({
      query: {
        skip: 0,
        take: 10,
      },
      headers: {
        'x-api-key': 'invalid jwt',
        'x-pagination': 5,
      },
    });

    expect(response).toEqual({
      status: 401,
      body: {
        message: 'Unauthorized',
      },
    });
  });

  it('GET /posts should work with guest', async () => {
    const { headers, ...response } = await client.getPosts({
      query: {
        skip: 0,
        take: 10,
      },
      headers: {
        'x-api-key': SAMPLE_GUEST_JWT,
        'x-pagination': 5,
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        posts: [
          {
            content: 'Content',
            description: 'Description',
            id: '1',
            published: true,
            title: 'Post',
          },
          {
            content: 'Content',
            description: 'Description',
            id: '2',
            published: true,
            title: 'Post',
          },
        ],
        count: 0,
        skip: 0,
        take: 10,
      },
    });

    expect(headers.get('x-powered-by')).toBe('Express');
  });

  it('GET /posts should work with user', async () => {
    const { headers, ...response } = await client.getPosts({
      query: {
        skip: 0,
        take: 10,
      },
      headers: {
        'x-api-key': SAMPLE_NON_OWNER_JWT,
        'x-pagination': 5,
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        posts: [
          {
            content: 'Content',
            description: 'Description',
            id: '1',
            published: true,
            title: 'Post',
          },
          {
            content: 'Content',
            description: 'Description',
            id: '2',
            published: true,
            title: 'Post',
          },
        ],
        count: 0,
        skip: 0,
        take: 10,
      },
    });
  });

  it('POST /posts should fail with guest', async () => {
    const { headers, ...response } = await client.createPost({
      body: {
        title: 'Title',
        content: 'content',
      },
      headers: {
        'x-api-key': SAMPLE_GUEST_JWT,
      },
    });

    expect(response).toEqual({
      status: 403,
      body: {
        message: 'You do not have permission',
      },
    });
  });

  it('POST /posts should succeed with user', async () => {
    const { headers, ...response } = await client.createPost({
      body: {
        title: 'Title',
        content: 'content',
      },
      headers: {
        'x-api-key': SAMPLE_NON_OWNER_JWT,
      },
    });

    expect(response).toEqual({
      status: 201,
      body: {
        content: 'content',
        description: 'Description',
        id: 'mock-id',
        published: true,
        title: 'Title',
      },
    });
  });

  it('PATCH /posts/:id should succeed with owner user', async () => {
    const { headers, ...response } = await client.updatePost({
      params: {
        id: '1',
      },
      body: {
        title: 'Title',
        content: 'content',
      },
      headers: {
        'x-api-key': SAMPLE_OWNER_JWT,
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        content: 'content',
        description: 'Description',
        id: '1',
        published: true,
        title: 'Title',
      },
    });
  });

  it('PATCH /posts/:id should fail with non-owner user', async () => {
    const { headers, ...response } = await client.updatePost({
      params: {
        id: '1',
      },
      body: {
        title: 'Title',
        content: 'content',
      },
      headers: {
        'x-api-key': SAMPLE_NON_OWNER_JWT,
      },
    });

    expect(response).toEqual({
      status: 403,
      body: {
        message: 'You are not the owner of this resource',
      },
    });
  });

  it('DELETE /posts/:id should succeed and receive header from middleware', async () => {
    const { headers, ...response } = await client.deletePost({
      params: {
        id: '1',
      },
      headers: {
        'x-api-key': SAMPLE_OWNER_JWT,
      },
    });

    expect(response).toEqual({
      status: 200,
      body: {
        message: 'Post deleted',
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
        'x-api-key': SAMPLE_GUEST_JWT,
        // @ts-expect-error - this should be a number
        'x-pagination': 'not a number',
      },
    });

    expect(response).toEqual({
      status: 400,
      body: {
        bodyErrors: null,
        headerErrors: {
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
        pathParameterErrors: null,
        queryParameterErrors: null,
      },
    });
  });
});
