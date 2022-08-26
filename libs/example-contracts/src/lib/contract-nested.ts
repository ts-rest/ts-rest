import { initTsRest } from '@ts-rest/core';
import { apiBlog } from './contract-blog';

const c = initTsRest();

const apiHealth = c.router({
  check: c.query({
    method: 'GET',
    path: () => '/health',
    responses: {
      200: c.response<{ message: string }>(),
    },
    query: null,
    summary: 'Check health',
  }),
});

export const apiNested = c.router({
  /**
   * Posts API
   */
  posts: apiBlog,
  /**
   * Health API
   */
  health: apiHealth,
});
