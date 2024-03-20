import { initContract, ResponseValidationError } from '@ts-rest/core';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  createNextRoute,
  createNextRouter,
  createSingleRouteHandler,
  RequestValidationError,
} from './ts-rest-next';
import { z } from 'zod';

const c = initContract();

const contract = c.router({
  get: {
    method: 'GET',
    path: '/test',
    query: c.body<{ test: string }>(),
    responses: {
      200: c.response<{ message: string }>(),
    },
  },
  getWithParams: {
    method: 'GET',
    path: `/test/:id`,
    query: null,
    responses: {
      200: c.response<{ id: string }>(),
    },
  },
  getWithQuery: {
    method: 'GET',
    path: `/test-query`,
    query: c.body<{ test: string; foo: number }>(),
    responses: {
      200: c.response<{ test: string; foo: number }>(),
    },
  },
  advanced: {
    method: 'POST',
    path: `/advanced/:id`,
    body: c.body<{ test: string }>(),
    responses: {
      200: c.response<{ id: string; test: string }>(),
    },
    pathParams: z.object({
      id: z.string(),
    }),
  },
  getZodQuery: {
    method: 'GET',
    path: '/test/:id/:name',
    pathParams: z.object({
      id: z.string().transform(Number),
    }),
    query: z.object({
      field: z.string().optional(),
    }),
    responses: {
      200: z.object({
        id: z.number().lt(1000),
        name: z.string(),
        defaultValue: z.string().default('hello world'),
      }),
    },
  },
});

const nextEndpoint = createNextRoute(contract, {
  get: async ({ query: { test } }) => {
    return {
      status: 200,
      body: {
        message: test,
      },
    };
  },
  getWithParams: async ({ params: { id } }) => {
    return {
      status: 200,
      body: {
        id,
      },
    };
  },
  getWithQuery: async ({ query }) => {
    return {
      status: 200,
      body: {
        ...query,
      },
    };
  },
  advanced: async ({ body: { test }, params: { id } }) => {
    return {
      status: 200,
      body: {
        id,
        test,
      },
    };
  },
  getZodQuery: async ({ params, query }) => {
    return {
      status: 200,
      body: {
        ...params,
        ...query,
      },
    };
  },
});

const jsonMock = jest.fn();
const sendMock = jest.fn();

const mockRes = {
  status: jest.fn(() => ({
    end: jest.fn(),
    json: jsonMock,
    send: sendMock,
  })),
  setHeader: jest.fn(),
} as unknown as NextApiResponse;

describe('strict mode', () => {
  const c = initContract();
  const postsRouter = c.router({
    getPost: {
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: null,
      },
    },
  });

  it('allows unknown responses when not in strict mode', () => {
    const cLoose = c.router({ posts: postsRouter });
    createNextRoute(cLoose, {
      posts: {
        getPost: async () => ({ status: 201, body: null }),
      },
    });
  });

  it('does not allow unknown statuses when in strict mode', () => {
    const cStrict = c.router(
      { posts: postsRouter },
      { strictStatusCodes: true },
    );
    createNextRoute(cStrict, {
      posts: {
        // @ts-expect-error 201 is not defined as a known response
        getPost: async () => ({ status: 201, body: null }),
      },
    });
  });
});
describe('createNextRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should send back a 200', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test', {
      method: 'GET',
      query: { test: 'test-query-string', foo: 123 },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'test-query-string',
    });
  });

  it('should send back a 404', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/wrong-url', {
      // <- Wrong URL
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send back a 404', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test', {
      method: 'POST', // <- Wrong method
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send body, params and query correctly', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/advanced/test-id', {
      method: 'POST',
      body: {
        test: 'test-body',
      },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: 'test-id',
      test: 'test-body',
    });
  });

  it('should send json query correctly', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint, {
      jsonQuery: true,
    });

    const req = mockReq('/test-query', {
      method: 'GET',
      query: { test: '"test-query-string"', foo: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      test: 'test-query-string',
      foo: 123,
    });
  });

  it('should differentiate between /test and /test/id', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const req = mockReq('/test/3', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '3',
    });
  });

  describe('response validation', () => {
    it('should include default value and removes extra field', async () => {
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        responseValidation: true,
      });

      const req = mockReq('/test/123/name', {
        method: 'GET',
        query: { field: 'foo' },
      });

      await resultingRouter(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        id: 123,
        name: 'name',
        defaultValue: 'hello world',
      });
    });

    it('fails with invalid field', async () => {
      const errorHandler = jest.fn();
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        responseValidation: true,
        errorHandler,
      });

      const req = mockReq('/test/2000/name', {
        method: 'GET',
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('request validation', () => {
    it('fails with invalid query type', async () => {
      const errorHandler = jest.fn();
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        throwRequestValidation: true,
        errorHandler,
      });

      const req = mockReq('/test/100/throw', {
        method: 'GET',
        query: { field: 42 },
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(RequestValidationError),
        expect.anything(),
        expect.anything(),
      );
    });

    it('does not throw with invalid query type', async () => {
      const errorHandler = jest.fn();
      const resultingRouter = createNextRouter(contract, nextEndpoint, {
        throwRequestValidation: false,
        errorHandler,
      });

      const req = mockReq('/test/100/throw', {
        method: 'GET',
        query: { field: 42 },
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  it('should handle non-json response types from contract', async () => {
    const c = initContract();

    const contract = c.router({
      postIndex: {
        method: 'POST',
        path: `/index.html`,
        body: z.object({
          echoHtml: z.string(),
        }),
        responses: {
          200: c.otherResponse({
            contentType: 'text/html',
            body: z.string().regex(/^<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>$/im),
          }),
        },
      },
      getRobots: {
        method: 'GET',
        path: `/robots.txt`,
        responses: {
          200: c.otherResponse({
            contentType: 'text/plain',
            body: c.type<string>(),
          }),
        },
      },
      getCss: {
        method: 'GET',
        path: '/style.css',
        responses: {
          200: c.otherResponse({
            contentType: 'text/css',
            body: c.type<string>(),
          }),
        },
      },
    });

    const router = createNextRouter(
      contract,
      {
        postIndex: async ({ body: { echoHtml } }) => {
          return {
            status: 200,
            body: echoHtml,
          };
        },
        getRobots: async () => {
          return {
            status: 200,
            body: 'User-agent: * Disallow: /',
          };
        },
        getCss: async () => {
          return {
            status: 200,
            body: 'body { color: red; }',
          };
        },
      },
      {
        responseValidation: true,
        errorHandler: (err: any, req, res) => {
          if (err instanceof ResponseValidationError) {
            return res.status(500).send('Response validation failed');
          }
          return res.status(500).send('Server Error');
        },
      },
    );

    let req = mockReq('/index.html', {
      method: 'POST',
      body: { echoHtml: '<h1>hello world</h1>' },
    });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/html');
    expect(sendMock).toHaveBeenCalledWith('<h1>hello world</h1>');

    req = mockReq('/index.html', {
      method: 'POST',
      body: { echoHtml: 'hello world' },
    });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(sendMock).toHaveBeenCalledWith('Response validation failed');

    req = mockReq('/robots.txt', { method: 'GET' });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'content-type',
      'text/plain',
    );
    expect(sendMock).toHaveBeenCalledWith('User-agent: * Disallow: /');

    req = mockReq('/style.css', { method: 'GET' });
    await router(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/css');
    expect(sendMock).toHaveBeenCalledWith('body { color: red; }');
  });
});

describe('createSingleUrlNextRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send back a 200', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test/123', {
      method: 'GET',
      query: { id: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '123',
    });
  });

  it('should send back a 404', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/wrong-url', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send back a 404', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test', {
      method: 'GET',
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should send body, params and query correctly', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.advanced,
      nextEndpoint.advanced,
    );

    const req = mockSingleUrlReq('/advanced/123', {
      method: 'POST',
      body: {
        test: 'test-body',
      },
      query: { id: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '123',
      test: 'test-body',
    });
  });

  it('should send json query correctly', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithQuery,
      nextEndpoint.getWithQuery,
      { jsonQuery: true },
    );

    const req = mockSingleUrlReq('/test-query', {
      method: 'GET',
      query: { test: '"test-query-string"', foo: '123' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      test: 'test-query-string',
      foo: 123,
    });
  });

  it('should differentiate between /test and /test/id', async () => {
    const resultingRouter = createSingleRouteHandler(
      contract.getWithParams,
      nextEndpoint.getWithParams,
    );

    const req = mockSingleUrlReq('/test/3', {
      method: 'GET',
      query: { id: '3' },
    });

    await resultingRouter(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      id: '3',
    });
  });

  describe('response validation', () => {
    it('should include default value and removes extra field', async () => {
      const resultingRouter = createSingleRouteHandler(
        contract.getZodQuery,
        nextEndpoint.getZodQuery,
        { responseValidation: true },
      );

      const req = mockSingleUrlReq('/test/123/name', {
        method: 'GET',
        query: { field: 'foo', id: '123', name: 'name' },
      });

      await resultingRouter(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        id: 123,
        name: 'name',
        defaultValue: 'hello world',
      });
    });

    it('fails with invalid field', async () => {
      const errorHandler = jest.fn();
      const resultingRouter = createSingleRouteHandler(
        contract.getZodQuery,
        nextEndpoint.getZodQuery,
        { responseValidation: true, errorHandler },
      );

      const req = mockSingleUrlReq('/test/2000/name', {
        method: 'GET',
        query: { id: '2000', name: 'name' },
      });

      await resultingRouter(req, mockRes);

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});

export const mockReq = (
  url: string,
  args: {
    query?: Record<string, unknown>;
    body?: unknown;
    method: string;
  },
): NextApiRequest => {
  const paramArray = url.split('/').splice(1);

  const req = {
    query: {
      ...args.query,
      ['ts-rest']: paramArray,
    },
    body: args.body,
    method: args.method,
  } as unknown as NextApiRequest;

  return req;
};

const mockSingleUrlReq = (
  url: string,
  args: { query?: Record<string, unknown>; body?: unknown; method: string },
): NextApiRequest => {
  const req = {
    url,
    query: args.query,
    body: args.body,
    method: args.method,
  } as unknown as NextApiRequest;

  return req;
};
