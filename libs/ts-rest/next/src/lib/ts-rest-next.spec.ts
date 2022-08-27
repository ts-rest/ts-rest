import { initTsRest } from '@ts-rest/core';
import { NextApiRequest, NextApiResponse } from 'next';
import { createNextRoute, createNextRouter } from './ts-rest-next';

const c = initTsRest();

const contract = c.router({
  get: c.query({
    method: 'GET',
    path: () => '/test',
    query: null,
    responses: {
      200: c.response<{ message: string }>(),
    },
  }),
});

const nextEndpoint = createNextRoute(contract, {
  get: async (args) => {
    return {
      status: 200,
      body: {
        message: 'Hello World',
      },
    };
  },
});

describe('createNextRouter', () => {
  it('should send back a 200', async () => {
    const resultingRouter = createNextRouter(contract, nextEndpoint);

    const mockReq = {
      query: {
        ['ts-rest']: ['test'],
      },
      method: 'GET',
    } as unknown as NextApiRequest;

    const jsonMock = jest.fn();

    const mockRes = {
      status: jest.fn(() => ({ end: jest.fn(), json: jsonMock })),
    } as unknown as NextApiResponse;

    await resultingRouter(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Hello World',
    });
  });
});
