import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { apiBlog } from '@ts-rest-examples/contracts';

export const tsr = initTsrReactQuery(apiBlog, {
  baseUrl: 'http://localhost:3000/api',
  baseHeaders: {
    'x-api-key': () => {
      return 'foo';
    },
  },
});
