import type { Equal, Expect } from './test-helpers';
import { initContract } from './dsl';
import { z } from 'zod';
import { TsRestResponseError } from './response-error';
import { HTTPStatusCode } from './status-codes';

const c = initContract();

const contract = c.router(
  {
    posts: {
      getPost: {
        method: 'GET',
        path: '/posts/:id',
        responses: {
          200: z.object({
            id: z.number(),
            content: z.string(),
          }),
        },
      },
    },
    users: {
      getUser: {
        method: 'GET',
        path: '/users/:id',
        responses: {
          200: z.object({
            id: z.number(),
            name: z.string(),
          }),
        },
      },
    },
  },
  {
    commonResponses: {
      404: z.object({
        message: z.string(),
      }),
    },
  },
);

describe('TsRestResponseError', () => {
  it('correctly sets response type for single endpoint', () => {
    type ResponseType = Expect<
      Equal<
        ConstructorParameters<
          typeof TsRestResponseError<typeof contract.posts.getPost>
        >[1],
        | { status: 200; body: { id: number; content: string } }
        | { status: 404; body: { message: string } }
        | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown }
      >
    >;
  });

  it('correctly sets response type for entire contract', () => {
    type ResponseType = Expect<
      Equal<
        ConstructorParameters<typeof TsRestResponseError<typeof contract>>[1],
        { status: 404; body: { message: string } }
      >
    >;
  });
});
