import { initTsRest } from '@ts-rest/core';

const c = initTsRest();

type User = {
  id: string;
  name: string | null;
  email: string | null;
};

export const routerBasic = c.router({
  users: c.query({
    method: 'GET',
    path: () => '/users',
    response: c.response<User[]>(),
    query: null,
  }),
  updateUser: c.mutation({
    method: 'PUT',
    path: ({ id }: { id: string }) => `/users/${id}`,
    response: c.response<User>(),
    body: c.body<{ name: string | null; email: string | null }>(),
  }),
});
