import { initTsRest } from '@ts-rest/core';
import { NextApiResponse } from 'next';
import { createNextRoute, createNextRouter } from './ts-rest-next';
import { mockReq } from './test-helpers';

const c = initTsRest();

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
      query: { test: 'test-query-string' },
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
