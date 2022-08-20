import { initClient, initTsRest } from '@ts-rest/core';

const c = initTsRest();

type User = {
  id: string;
  name: string | null;
  email: string | null;
};

export const routerBasic = c.router({
  user: c.query({
    method: 'GET',
    path: ({ id }: { id: string }) => `/basic/users/${id}`,
    responses: {
      200: c.response<User | null>(),
    },
    query: null,
    summary: 'Get all users',
  }),
  updateUser: c.mutation({
    method: 'PATCH',
    path: ({ id }: { id: string }) => `/basic/users/${id}`,
    body: c.body<{ name: string | null; email: string | null }>(),
    responses: {
      200: c.response<User>(),
      400: c.response<{ message: string }>(),
    },
    summary: 'Update a user',
  }),
});

// const client = initClient(routerBasic, {
//   baseUrl: 'http://localhost:3000',
//   baseHeaders: {},
// });

// const data = await client.user({ params: { id: '1' } });

// if (data.status === 200) {
//   data.data;
// }

// const updatedUser = await client.updateUser({
//   params: { id: '1' },
//   body: { email: '', name: '' },
// });

// if (updatedUser.status === 400) {
//   updatedUser.data;
// }
