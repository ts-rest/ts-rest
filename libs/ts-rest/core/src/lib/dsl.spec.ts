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

  it('should be typed correctly with headers', () => {
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
          headers: z.object({
            'x-foo': z.string(),
          }),
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
              headers: z.ZodObject<
                { 'x-foo': z.ZodString },
                'strip',
                z.ZodTypeAny,
                { 'x-foo': string },
                { 'x-foo': string }
              >;
            };
          };
        }
      >
    >;
  });

  it('should be typed correctly with base headers', () => {
    const contract = c.router(
      {
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
      },
      {
        baseHeaders: z.object({
          'x-foo': z.string(),
        }),
      }
    );

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
              headers: z.ZodObject<
                { 'x-foo': z.ZodString },
                'strip',
                z.ZodTypeAny,
                { 'x-foo': string },
                { 'x-foo': string }
              >;
            };
          };
        }
      >
    >;
  });

  it('should be typed correctly with merged headers', () => {
    const contract = c.router(
      {
        posts: {
          getPost: {
            method: 'GET',
            path: '/posts/:id',
            responses: {
              200: z.object({
                id: z.number(),
              }),
            },
            headers: z.object({
              'x-bar': z.string(),
            }),
          },
        },
      },
      {
        baseHeaders: z.object({
          'x-foo': z.string(),
        }),
      }
    );

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
              headers: z.ZodObject<
                z.objectUtil.MergeShapes<
                  { 'x-foo': z.ZodString },
                  { 'x-bar': z.ZodString }
                >,
                'strip',
                z.ZodTypeAny,
                { 'x-foo': string; 'x-bar': string },
                { 'x-foo': string; 'x-bar': string }
              >;
            };
          };
        }
      >
    >;
  });

  it('should be typed correctly with overridden headers', () => {
    const contract = c.router(
      {
        posts: {
          getPost: {
            method: 'GET',
            path: '/posts/:id',
            responses: {
              200: z.object({
                id: z.number(),
              }),
            },
            headers: z.object({
              'x-foo': z.string().optional(),
            }),
          },
        },
      },
      {
        baseHeaders: z.object({
          'x-foo': z.string(),
        }),
      }
    );

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
              headers: z.ZodObject<
                z.objectUtil.MergeShapes<
                  { 'x-foo': z.ZodString },
                  { 'x-foo': z.ZodOptional<z.ZodString> }
                >,
                'strip',
                z.ZodTypeAny,
                { 'x-foo'?: string },
                { 'x-foo'?: string }
              >;
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
