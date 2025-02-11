import * as path from 'path';
import concurrently, { ConcurrentlyResult } from 'concurrently';
import * as waitOn from 'wait-on';
import { exec } from 'child_process';

jest.setTimeout(60000);

describe('example-cloudflare-worker', () => {
  let proc: ConcurrentlyResult;

  beforeAll(async () => {
    // Kill any existing processes on port 8787
    try {
      await new Promise((resolve) => {
        exec('lsof -ti:8787 | xargs kill -9', resolve);
      });
    } catch (error) {
      console.log('No existing process to kill');
    }

    const startServer = async (retries = 3) => {
      try {
        proc = concurrently(
          [
            {
              cwd: path.resolve(__dirname, '../..'),
              command: 'pnpm nx serve example-cloudflare-worker',
            },
          ],
          {
            killOthers: ['failure', 'success'],
          },
        );

        proc.commands.forEach((command) => {
          command.process?.on('error', (error) => {
            console.error('Server process error:', error);
          });
        });

        await waitOn({
          resources: ['tcp:127.0.0.1:8787'],
          timeout: 30000,
          validateStatus: (status) => status === 200,
          headers: { 'x-api-key': 'foo' },
        });
      } catch (error) {
        if (retries > 0) {
          console.log(
            `Retrying server startup. Attempts remaining: ${retries - 1}`,
          );
          await cleanup();
          await startServer(retries - 1);
        } else {
          throw error;
        }
      }
    };

    await startServer();
  });

  const cleanup = async () => {
    if (proc) {
      proc.commands.forEach((command) => {
        try {
          command.kill('SIGTERM');
        } catch (error) {
          console.warn('Error killing process:', error);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  afterAll(async () => {
    await cleanup();
  });

  it('GET /posts should return an array of posts', async () => {
    const response = await fetch('http://127.0.0.1:8787/posts?skip=0&take=10', {
      headers: {
        'x-api-key': 'foo',
        'x-pagination': '5',
      },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(2);
    expect(body.skip).toStrictEqual(0);
    expect(body.take).toStrictEqual(10);
    expect(response.headers.get('x-geo-country')).toStrictEqual('US');
  });

  it('should error on invalid pagination header', async () => {
    const response = await fetch('http://127.0.0.1:8787/posts?skip=0&take=10', {
      headers: {
        'x-api-key': 'foo',
        'x-pagination': 'not a number',
      },
    });
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
    const response = await fetch('http://127.0.0.1:8787/posts?skip=0', {
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
    const response = await fetch('http://127.0.0.1:8787/posts', {
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
    const response = await fetch('http://127.0.0.1:8787/posts?skip=0&take=10');
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
    const response = await fetch('http://127.0.0.1:8787/posts', {
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
    const response = await fetch('http://127.0.0.1:8787/test/123/name', {
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
