import { Hono } from 'hono';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { initServer, createHonoEndpoints } from '@ts-rest/hono';

const c = initContract();

const contract = c.router({
  test: {
    method: 'GET',
    path: '/test',
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
  mutationTest: {
    method: 'POST',
    path: '/test',
    body: z.object({
      foo: z.string(),
    }),
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
  fileUploadTest: {
    method: 'POST',
    path: '/file-upload',
    contentType: 'multipart/form-data',
    body: c.body<{ file: File }>(),
    responses: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
});

const server = initServer();

const handlers = server.router(contract, {
  test: async (_, c) => {
    return {
      status: 200,
      body: {
        foo: 'Hello World!',
      },
    };
  },
  mutationTest: async ({ body }, c) => {
    return {
      status: 200,
      body: {
        foo: body.foo,
      },
    };
  },
  fileUploadTest: async (args, c) => {
    const fileName = 'jeff';

    return {
      status: 200,
      body: {
        message: `File ${fileName} uploaded`,
      },
    };
  },
});

export const app = new Hono();

createHonoEndpoints(contract, handlers, app);
