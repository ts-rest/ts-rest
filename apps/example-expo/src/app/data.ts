import { apiBlog } from '@ts-rest/example-contracts';
import { initQueryClient } from '@ts-rest/react-query';

export const apiClient = initQueryClient(apiBlog, {
  baseHeaders: {},
  baseUrl: 'http://10.0.0.125:3334',
});
