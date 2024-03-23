import { initContract } from '@ts-rest/core';
import { apiBlog } from './contract-blog';

const c = initContract();

const apiHealth = c.router({
  check: {
    method: 'GET',
    path: '/health',
    responses: {
      200: c.type<{ message: string }>(),
    },
    query: null,
    summary: 'Check health',
  },
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
