import { initContract } from '@ts-rest/core';
import { NextApiRequest, NextApiResponse } from 'next';
import { createNextRoute, createNextRouter } from './ts-rest-next';

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
});

const jsonMock = jest.fn();

const mockRes = {
  status: jest.fn(() => ({
    end: jest.fn(),
    json: jsonMock,
  })),
} as unknown as NextApiResponse;

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
});

export const mockReq = (
  url: string,
  args: {
    query?: Record<string, unknown>;
    body?: unknown;
    method: string;
  }
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
