import { apiBlog } from '@ts-rest/example-contracts';
import { initQueryClient } from '@ts-rest/vue-query';

export const client = initQueryClient(apiBlog, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {
    'x-api-key': 'key',
  },
});
