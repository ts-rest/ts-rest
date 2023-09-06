import { initContract } from '@ts-rest/core';

import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

import { contractLite } from './contractLite';

const c = initContract();
export const contractBig = c.bigRouter(contractLite, {
  createComputer: {
    body: z.object({
      name: z.string(),
    }),
    responses: {
      200: z
        .object({
          id: z.string(),
        })
        .openapi({
          description: 'The computer id',
        }),
    },
  },
  getComputer: {
    responses: {
      200: z.object({
        id: z.string(),
        name: z.string(),
      }),
    },
  },
  cillComputer: {
    body: z.object({
      name: z.string(),
      id: z.string(),
    }),
    responses: {
      200: z.object({
        id: z.string(),
        name: z.string(),
      }),
    },
  },
});

export type ContractBig = typeof contractBig;
