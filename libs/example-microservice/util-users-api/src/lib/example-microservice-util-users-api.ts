import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export type User = z.infer<typeof UserSchema>;

const c = initContract();

export const usersApi = c.router({
  getUser: {
    method: 'GET',
    path: '/users/:id',
    responses: {
      200: UserSchema,
    },
  },
  updateUserAvatar: {
    method: 'POST',
    path: '/users/:id/avatar',
    contentType: 'multipart/form-data',
    body: c.body<{ avatar: File }>(),
    responses: {
      200: z.object({
        message: z.string(),
      }),
      400: z.object({
        message: z.string(),
      }),
    },
  },
});
