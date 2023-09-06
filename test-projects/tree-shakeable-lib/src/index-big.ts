import { initClient } from '@ts-rest/core';
import { contractBig } from './lib/contractBig';

export const client = initClient(contractBig)({
  baseHeaders: {},
  baseUrl: 'http://localhost:5050',
});
