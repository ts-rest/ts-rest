import { initContract } from '@ts-rest/core';
import { z } from 'zod';
const c = initContract();

export type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <
  T
>() => T extends b ? 1 : 2
  ? true
  : false;

export type Expect<a extends true> = a;

export const contract = c.router({
  createPost: {
    method: 'POST',
    path: '/a',
    body: z.object({
      logo: z.string().optional(),
      icon: z.string().optional(),
      nickname: z.string().optional(),
    }),
    responses: {
      200: c.body<{ id: string }[]>(),
      400: null,
      404: null,
    },
  },
});

contract.createPost.path;

type PathPrefixWorksInNonStrict = Expect<
  Equal<typeof contract.createPost.path, '/a'>
>;

export const emptyOptionsContract = c.router(
  {
    createPost: {
      method: 'POST',
      path: '/a',
      body: z.object({
        logo: z.string().optional(),
        icon: z.string().optional(),
        nickname: z.string().optional(),
      }),
      responses: {
        200: c.body<{ id: string }[]>(),
        400: null,
        404: null,
      },
    },
  },
  {}
);

emptyOptionsContract.createPost.path;

type EmptyOptionsWorksInNonStrict = Expect<
  Equal<typeof emptyOptionsContract.createPost.path, '/a'>
>;

export const prefixedContract = c.router(
  {
    createPost: {
      method: 'POST',
      path: '/a',
      body: z.object({
        logo: z.string().optional(),
        icon: z.string().optional(),
        nickname: z.string().optional(),
      }),
      responses: {
        200: c.body<{ id: string }[]>(),
        400: null,
        404: null,
      },
    },
  },
  {
    pathPrefix: '/prefix',
  }
);

prefixedContract.createPost.path;
