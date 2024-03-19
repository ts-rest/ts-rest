import { initContract } from '@ts-rest/core';

const c = initContract();

export const contract = c.router({
  getHello: {
    method: 'GET',
    path: '/',
    responses: {
      200: c.type<string>(),
    },
  },
});
