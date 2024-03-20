import { createNextHandler } from '@ts-rest/serverless/next-edge';
import { testContract } from '../../../contracts/test-contract';

export const config = {
  runtime: 'edge',
};

export default createNextHandler(
  testContract,
  {
    test: async ({ params, query }) => {
      return {
        status: 200,
        body: {
          ...params,
          ...query,
          deleteMe: 'response validation will delete me :(',
        },
      };
    },
  },
  {
    basePath: '/api/edge',
    jsonQuery: true,
    responseValidation: true,
  },
);
