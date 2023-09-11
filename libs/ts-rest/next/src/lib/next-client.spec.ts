import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { initNextClient } from './next-client';
import type { Equal, Expect } from './test-helpers';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

const c = initContract();
const contract = c.router({
  getUser: {
    method: 'GET',
    path: '/users/:id',
    responses: {
      200: UserSchema,
    },
  },
});

describe('next-client', () => {
  it('Client Args should include "next" property if client is initNextClient', () => {
    const usersClient = initNextClient(contract, {
      baseHeaders: {},
      baseUrl: 'http://localhost:5002',
    });
    type UserClient = typeof usersClient;
    type Test = Parameters<UserClient['getUser']>[0]
    type ExpectedClientArgs = {
      params: {
        id: string;
      };
      next?: {
        revalidate?: number | false | undefined;
        tags?: string[] | undefined;
      } | undefined;
      extraHeaders?: Test['extraHeaders'];
      cache?: RequestCache
    }
    type NextClientTypeTest = Expect<Equal<Test, ExpectedClientArgs>>;

  });
  it('Should include "next" property in the fetch request', async () => {
    const usersClient = initNextClient(contract, {
      baseHeaders: {},
      baseUrl: 'http://localhost:5002',
    });
    global.fetch = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve({
        id: '1',
        name: 'John',
        email: 'some@email'
      }),
      headers: new Headers({
        'content-type': 'application/json'
      })
    } as Response));
    await usersClient.getUser({ params: { id: '1' }, next: { revalidate: 1, tags: ['user1'] } });
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5002/users/1', {
      cache: undefined,
      headers: {},
      body: undefined,
      credentials: undefined,
      method: 'GET',
      signal: undefined,
      next: { revalidate: 1, tags: ['user1'] }
    });
    (global.fetch as jest.Mock).mockClear();
  })
}
)