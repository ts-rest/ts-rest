import { initQueryClient } from '@ts-rest/react-query';
import { initClient } from '@ts-rest/core';
import { router } from '@ts-rest/example-contracts';

export const clientExpress = initClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

export const clientNest = initClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
});

export const clientReactQuery = initQueryClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
});
