/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { initContract } from './dsl';
import type { Equal, Expect } from './test-helpers';
const c = initContract();

describe('contract', () => {
  it('should be typed correctly', () => {
    const contract = c.router({
      getPost: {
        method: 'GET',
        path: '/posts/:id',
        responses: {
          200: z.object({
            id: z.number(),
          }),
        },
      },
    });

    type ContractShape = Expect<
      Equal<
        typeof contract,
        {
          getPost: {
            method: 'GET';
            path: '/posts/:id';
            responses: {
              200: z.ZodObject<
                {
                  id: z.ZodNumber;
                },
                'strip',
                z.ZodTypeAny,
                {
                  id: number;
                },
                {
                  id: number;
                }
              >;
            };
          };
        }
      >
    >;
  });

  it('should be typed correctly with nested routers', () => {
    const contract = c.router({
      posts: {
        getPost: {
          method: 'GET',
          path: '/posts/:id',
          responses: {
            200: z.object({
              id: z.number(),
            }),
          },
        },
      },
    });

    type ContractShape = Expect<
      Equal<
        typeof contract,
        {
          posts: {
            getPost: {
              method: 'GET';
              path: '/posts/:id';
              responses: {
                200: z.ZodObject<
                  {
                    id: z.ZodNumber;
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    id: number;
                  },
                  {
                    id: number;
                  }
                >;
              };
            };
          };
        }
      >
    >;
  });

  it('should be typed without zod', () => {
    const contract = c.router({
      getPost: {
        method: 'GET',
        path: '/posts/:id',
        responses: {
          200: c.body<{ id: number }>(),
        },
      },
    });

    type ContractShape = Expect<
      Equal<
        typeof contract,
        {
          getPost: {
            method: 'GET';
            path: '/posts/:id';
            responses: {
              200: {
                id: number;
              };
            };
          };
        }
      >
    >;
  });
});
