import { initServer } from '@ts-rest/express';
import { contractBig } from '../lib/contractBig';

const s = initServer();

export const server = s.router(contractBig, {
  createComputer: async ({ body }) => {
    return {
      status: 200,
      body: {
        id: '1',
      },
    };
  },
  getComputer: async () => {
    return {
      status: 200,
      body: {
        id: '1',
        name: 'test',
      },
    };
  },
  cillComputer: async ({ body }) => {
    return {
      status: 200,
      body: {
        id: body.id,
        name: body.name,
      },
    };
  },
});
