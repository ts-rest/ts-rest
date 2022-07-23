import { Schema } from './api';
import { initClient } from './dsl';

const client = initClient<Schema>({
  baseUrl: 'http://localhost:3000',
  baseHeaders: {
    Authorization: 'Bearer 123',
  },
});

const { data: users } = client.user.getUsers();

const { data: user } = client.user.getUser({ id: '1' });
