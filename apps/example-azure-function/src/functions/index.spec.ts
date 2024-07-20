import * as path from 'path';
import concurrently, { ConcurrentlyResult } from 'concurrently';
import * as waitOn from 'wait-on';

jest.setTimeout(30000);

describe('example-azure-function', () => {
  let proc: ConcurrentlyResult;

  beforeAll(async () => {
    proc = concurrently(
      [
        {
          cwd: path.resolve(__dirname, '../..'),
          command: 'pnpm nx serve example-azure-function',
        },
      ],
      {
        killOthers: ['failure', 'success'],
      },
    );

    await waitOn({
      resources: ['tcp:127.0.0.1:7071'],
    });
  });

  afterAll(() => {
    proc.commands[0].kill();
  });

  it('GET /posts should return an array of posts', async () => {
    const response = await fetch(
      'http://127.0.0.1:7071/posts?skip="0"&take="10"',
      {
        headers: {
          'x-api-key': 'foo',
          'x-pagination': '5',
        },
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(2);
    expect(body.skip).toStrictEqual(0);
    expect(body.take).toStrictEqual(10);
  });

  it('should error on invalid pagination header', async () => {
    const response = await fetch(
      'http://127.0.0.1:7071/posts?skip="0"&take="10"',
      {
        headers: {
          'x-api-key': 'foo',
          'x-pagination': 'not a number',
        },
      },
    );
    const body = await response.json();

    expect(response.status).toStrictEqual(400);
    expect(body).toEqual({
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
    });
  });

  it('should error if a required query param is missing', async () => {
    const response = await fetch('http://127.0.0.1:7071/posts?skip="0"', {
      headers: {
        'x-api-key': 'foo',
        'x-pagination': '5',
      },
    });
    const body = await response.json();

    expect(response.status).toStrictEqual(400);
    expect(body).toEqual({
      message: 'Request validation failed',
      bodyErrors: null,
      headerErrors: null,
      pathParameterErrors: null,
      queryParameterErrors: {
        issues: [
          {
            code: 'invalid_type',
            expected: 'string',
            message: 'Required',
            path: ['take'],
            received: 'undefined',
          },
        ],
        name: 'ZodError',
      },
    });
  });

  it('should error if body is incorrect', async () => {
    const response = await fetch('http://127.0.0.1:7071/posts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'foo',
      },
      body: JSON.stringify({
        title: 'Good title',
        content: 123,
      }),
    });
    const body = await response.json();

    expect(response.status).toStrictEqual(400);
    expect(body).toEqual({
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
    });
  });

  it('should error if api key header is missing', async () => {
    const response = await fetch(
      'http://127.0.0.1:7071/posts?skip="0"&take="10"',
    );
    const body = await response.json();

    expect(response.status).toStrictEqual(400);
    expect(body).toEqual({
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
    });
  });

  it('should transform body correctly', async () => {
    const response = await fetch('http://127.0.0.1:7071/posts', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'foo',
      },
      body: JSON.stringify({
        title: 'Title with extra spaces     ',
        content: 'content',
      }),
    });
    const body = await response.json();

    expect(response.status).toStrictEqual(201);
    expect(body.title).toStrictEqual('Title with extra spaces');
  });

  it('should format params using pathParams correctly', async () => {
    const response = await fetch('http://127.0.0.1:7071/test/123/name', {
      headers: {
        'x-api-key': 'foo',
      },
    });
    const body = await response.json();

    expect(response.status).toStrictEqual(200);
    expect(body).toEqual({
      id: 123,
      name: 'name',
      defaultValue: 'hello world',
    });
  });
});
