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
    path: () => '/basic/users',
    response: c.response<User[]>(),
    query: null,
  }),
  updateUser: c.mutation({
    method: 'PATCH',
    path: ({ id }: { id: string }) => `/basic/users/${id}`,
    response: {
      200: c.response<User>(),
      400: c.response<{ message: string }>(),
    },
    body: c.body<{ name: string | null; email: string | null }>(),
  }),
});
