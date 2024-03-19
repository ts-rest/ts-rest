import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const testContract = c.router(
  {
    test: {
      method: 'GET',
      path: '/test/:id',
      pathParams: z.object({
        id: z.coerce.number(),
      }),
      query: z.object({
        foo: z.string(),
        bar: z.number(),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          foo: z.string(),
          bar: z.number(),
        }),
      },
    },
  },
  {
    strictStatusCodes: true,
  },
);
