import { initQueryClient } from '@ts-rest/client';
import { initClient } from '@ts-rest/core';
import { router } from '@tscont/example-contracts';

const api = async ({ path, method, headers, body }) => {
  const result = await fetch(path, { method, headers, body }).then((res) =>
    res.json()
  );

  return { status: 200, data: result };
};

export const clientExpress = initClient(router, {
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
  api,
});

export const clientNest = initClient(router, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
  api,
});

export const clientReactQuery = initQueryClient(router, {
  baseUrl: 'http://localhost:3335',
  baseHeaders: {},
  api,
});
