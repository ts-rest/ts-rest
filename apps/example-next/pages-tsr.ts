import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { apiBlog } from '@ts-rest/example-contracts';

export const tsr = initTsrReactQuery(apiBlog, {
  baseUrl: 'http://localhost:4200/api',
  baseHeaders: {
    'x-api-key': 'key',
  },
});
