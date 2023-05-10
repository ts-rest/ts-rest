import { Hono } from 'hono';
import { serve } from '@hono/node-server';
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
});

const app = new Hono();

createHonoEndpoints(contract, handlers, app);

serve({
  fetch: app.fetch,
  port: 3004,
});
