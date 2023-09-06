import { initContract } from '@ts-rest/core';
import { z } from 'zod';
const c = initContract();

export const contractLite = c.liteRouter({
  createComputer: {
    method: 'POST',
    path: `/api/computers`,
    description: 'Create a computer',
    summary: 'Create a computer',
  },
  getComputer: {
    method: 'GET',
    path: `/api/computers/:id`,
  },
  cillComputer: {
    method: 'PUT',
    path: '/api/computers/:id',
  },
});
