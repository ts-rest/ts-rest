import { initTsRest } from '@ts-rest/core';
import { apiBlog } from './contract-blog';

const c = initTsRest();

export const apiNested = c.router({
  posts: apiBlog,
  health: c.router({
    check: c.query({
      method: 'GET',
      path: () => '/health',
      responses: {
        200: c.response<{ message: string }>(),
      },
      query: null,
      summary: 'Check health',
    }),
  }),
});
