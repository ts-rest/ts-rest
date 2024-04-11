import { initContract } from '@ts-rest/core';
import { parse as parseMultipart, getBoundary } from 'parse-multipart-data';
import { z } from 'zod';
import { vi } from 'vitest';
import { fetchRequestHandler } from './ts-rest-fetch';
import { TsRestRequest } from '../request';

const c = initContract();

const contract = c.router({
  test: {
    method: 'GET',
    path: '/test',
    query: z.object({
      foo: z.string(),
    }),
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
  ping: {
    method: 'POST',
    path: '/ping/:id',
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({
      ping: z.string(),
    }),
    responses: {
      200: z.object({
        id: z.number(),
        pong: z.string(),
      }),
    },
  },
  noContent: {
    method: 'POST',
    path: '/no-content',
    body: c.noBody(),
    responses: {
      204: c.noBody(),
    },
  },
  upload: {
    method: 'POST',
    path: '/upload',
    contentType: 'multipart/form-data',
    body: c.type<{ file: File }>(),
    responses: {
      200: c.otherResponse({
        contentType: 'application/octet-stream',
        body: c.type<Blob | string>(),
      }),
    },
  },
  throw: {
    method: 'GET',
    path: '/throw',
    responses: {
      500: c.noBody(),
    },
  },
});

const mockFn = vi.fn();

const testFetchRequestHandler = (request: Request) => {
  return fetchRequestHandler({
    contract,
    router: {
      test: async ({ query }) => {
        return {
          status: 200,
          body: {
            foo: query.foo,
          },
        };
      },
      ping: async ({ body, params }) => {
        return {
          status: 200,
          body: {
            id: params.id,
            pong: body.ping,
          },
        };
      },
      noContent: {
        middleware: [(req) => mockFn(req.foo)],
        handler: async () => {
          return {
            status: 204,
            body: undefined,
          } as const;
        },
      },
      upload: async (_, { request }) => {
        const boundary = getBoundary(
          request.headers.get('content-type') as string,
        );

        const bodyBuffer = await request.arrayBuffer();
        const parts = parseMultipart(Buffer.from(bodyBuffer), boundary);
        const blob = new Blob([parts[0].data], { type: parts[0].type });

        return {
          status: 200,
          body: blob,
        };
      },
      throw: async () => {
        throw new Error('Test error');
      },
    },
    options: {
      jsonQuery: true,
      responseValidation: true,
      cors: {
        origin: ['http://localhost'],
        credentials: true,
      },
      requestMiddleware: [
        (req: TsRestRequest & { foo: string }) => {
          req.foo = 'bar';
        },
      ],
      responseHandlers: [
        (res, req) => {
          res.headers.set('x-foo', req.foo);
        },
      ],
    },
    request,
  });
};

describe('fetchRequestHandler', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle GET request', async () => {
    const request = new Request('http://localhost/test?foo=bar', {
      headers: { origin: 'http://localhost' },
    });

    const response = await testFetchRequestHandler(request);
    const expectedResponse = new Response('{"foo":"bar"}', {
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'Origin',
        'x-foo': 'bar',
      },
    });

    expect(response.status).toEqual(expectedResponse.status);
    expect(response.headers).toEqual(expectedResponse.headers);
    expect(await response.json()).toEqual(await expectedResponse.json());
  });

  it('should handle POST request', async () => {
    const request = new Request('http://localhost/ping/123', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ping: 'foo' }),
    });

    const response = await testFetchRequestHandler(request);
    const expectedResponse = new Response('{"id":123,"pong":"foo"}', {
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'Origin',
        'x-foo': 'bar',
      },
    });

    expect(response.status).toEqual(expectedResponse.status);
    expect(response.headers).toEqual(expectedResponse.headers);
    expect(await response.json()).toEqual(await expectedResponse.json());
  });

  it('should handle no content response', async () => {
    const request = new Request('http://localhost/no-content', {
      method: 'POST',
      headers: { origin: 'http://localhost' },
    });

    const response = await testFetchRequestHandler(request);
    const expectedResponse = new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        vary: 'Origin',
        'x-foo': 'bar',
      },
    });

    expect(response.status).toEqual(expectedResponse.status);
    expect(response.headers).toEqual(expectedResponse.headers);
    expect(await response.text()).toEqual('');
    expect(mockFn).toHaveBeenCalledWith('bar');
  });

  it('should handle file upload', async () => {
    const request = new Request('http://localhost/upload', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type':
          'multipart/form-data; boundary=---WebKitFormBoundary7MA4YWxkTrZu0gW',
      },
      body:
        '-----WebKitFormBoundary7MA4YWxkTrZu0gW\r\n' +
        'Content-Disposition: form-data; name="file"; filename="a.html"\r\n' +
        'Content-Type: text/html\r\n' +
        '\r\n' +
        '<html><body><h1>Hello ts-rest!</h1></body></html>\r\n' +
        '-----WebKitFormBoundary7MA4YWxkTrZu0gW--',
    });

    const response = await testFetchRequestHandler(request);
    const expectedResponse = new Response(
      '<html><body><h1>Hello ts-rest!</h1></body></html>',
      {
        headers: {
          'access-control-allow-credentials': 'true',
          'access-control-allow-origin': 'http://localhost',
          'content-type': 'text/html',
          vary: 'Origin',
          'x-foo': 'bar',
        },
      },
    );

    expect(response.status).toEqual(expectedResponse.status);
    expect(response.headers).toEqual(expectedResponse.headers);
    expect(await response.text()).toEqual(await expectedResponse.text());
  });

  it('should handle validation error', async () => {
    const request = new Request('http://localhost/test', {
      headers: { origin: 'http://localhost' },
    });

    const response = await testFetchRequestHandler(request);
    const expectedResponse = new Response(
      '{"message":"Request validation failed","pathParameterErrors":null,"headerErrors":null,"queryParameterErrors":{"issues":[{"code":"invalid_type","expected":"string","received":"undefined","path":["foo"],"message":"Required"}],"name":"ZodError"},"bodyErrors":null}',
      {
        status: 400,
        headers: {
          'access-control-allow-credentials': 'true',
          'access-control-allow-origin': 'http://localhost',
          'content-type': 'application/json',
          vary: 'Origin',
          'x-foo': 'bar',
        },
      },
    );

    expect(response.status).toEqual(expectedResponse.status);
    expect(response.headers).toEqual(expectedResponse.headers);
    expect(await response.json()).toEqual(await expectedResponse.json());
  });

  it('should handle 500 response', async () => {
    const request = new Request('http://localhost/throw', {
      method: 'GET',
      headers: { origin: 'http://localhost' },
    });

    const response = await testFetchRequestHandler(request);
    const expectedResponse = new Response(null, {
      status: 500,
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost',
        'content-type': 'application/json',
        vary: 'Origin',
        'x-foo': 'bar',
      },
    });

    expect(response.status).toEqual(expectedResponse.status);
    expect(response.headers).toEqual(expectedResponse.headers);
    expect(await response.json()).toEqual({ message: 'Server Error' });
  });
});
