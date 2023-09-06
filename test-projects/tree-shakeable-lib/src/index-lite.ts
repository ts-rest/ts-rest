import { initClient } from '@ts-rest/core';
import { ContractBig } from './lib/contractBig';
import { contractLite } from './lib/contractLite';

export const client = initClient<ContractBig>(contractLite as any)({
  baseHeaders: {},
  baseUrl: 'http://localhost:5050',
});
