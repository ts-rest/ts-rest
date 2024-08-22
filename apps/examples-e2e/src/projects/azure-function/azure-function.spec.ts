import { apiBlog } from '@ts-rest-examples/contracts';
import { initClient } from '@ts-rest/core';
import { inject } from 'vitest';

const client = initClient(apiBlog, {
  baseUrl: `http://localhost:${inject('port')}`,
});

describe('azure-function', () => {
  it('GET /posts should return an array of posts', async () => {
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
        message: 'Request validation failed',
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
        message: 'Request validation failed',
        bodyErrors: null,
        headerErrors: null,
        pathParameterErrors: null,
        queryParameterErrors: {
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
        message: 'Request validation failed',
        bodyErrors: {
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
        headerErrors: null,
        pathParameterErrors: null,
        queryParameterErrors: null,
      },
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
        message: 'Request validation failed',
        bodyErrors: null,
        headerErrors: {
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
        pathParameterErrors: null,
        queryParameterErrors: null,
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
        content: 'content',
        description: 'Description',
        id: 'mock-id',
        published: true,
        title: 'Title with extra spaces',
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
