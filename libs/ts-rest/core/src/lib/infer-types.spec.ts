import { z } from 'zod';
import { initContract } from './dsl';
import { Equal, Expect } from './test-helpers';
import {
  InferRequestForClient,
  InferRequestForServer,
  InferResponseBodyForClient,
  InferResponseBodyForServer,
  InferResponsesForClient,
  InferResponsesForServer,
} from './infer-types';
import { HTTPStatusCode } from './status-codes';

const c = initContract();

const contract = c.router({
  getPost: {
    method: 'GET',
    path: '/posts/:id',
    pathParams: z.object({
      id: z.string().transform((id) => Number(id)),
    }),
    query: z.object({
      includeComments: z.boolean().default(false),
    }),
    responses: {
      200: z.object({
        id: z.number(),
        title: z.string().default('Untitled'),
        content: z.string(),
      }),
      404: z.object({
        message: z.string(),
      }),
    },
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    body: z.object({
      title: z.string(),
      content: z.string(),
    }),
    responses: {
      201: z.object({
        id: z.number(),
        title: z.string(),
        content: z.string(),
      }),
    },
  },
  uploadImage: {
    method: 'POST',
    path: '/images',
    contentType: 'multipart/form-data',
    body: c.body<{ image: File }>(),
    responses: {
      201: z.object({
        id: z.number(),
        url: z.string(),
      }),
    },
  },
  nested: {
    getComments: {
      method: 'GET',
      path: '/posts/:id/comments',
      pathParams: z.object({
        id: z.string().transform((id) => Number(id)),
      }),
      responses: {
        200: z.object({
          comments: z.array(
            z.object({
              id: z.number(),
              content: z.string(),
            })
          ),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
  },
});

it('type inference helpers', () => {
  type InferResponsesForServerTest = Expect<
    Equal<
      InferResponsesForServer<typeof contract>,
      {
        getPost:
          | {
              status: 200;
              body: { title?: string | undefined; id: number; content: string };
            }
          | { status: 404; body: { message: string } }
          | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown };
        createPost:
          | {
              status: 201;
              body: { id: number; title: string; content: string };
            }
          | { status: Exclude<HTTPStatusCode, 201>; body: unknown };
        uploadImage:
          | {
              status: 201;
              body: { id: number; url: string };
            }
          | { status: Exclude<HTTPStatusCode, 201>; body: unknown };
        nested: {
          getComments:
            | {
                status: 200;
                body: { comments: { id: number; content: string }[] };
              }
            | { status: 404; body: { message: string } }
            | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown };
        };
      }
    >
  >;

  type InferResponsesForServerTest2 = Expect<
    Equal<
      InferResponsesForServer<typeof contract, 200>,
      {
        getPost: {
          status: 200;
          body: { title?: string | undefined; id: number; content: string };
        };
        createPost: {
          status: 200;
          body: unknown;
        };
        uploadImage: {
          status: 200;
          body: unknown;
        };
        nested: {
          getComments: {
            status: 200;
            body: { comments: { id: number; content: string }[] };
          };
        };
      }
    >
  >;

  type InferResponsesForServerTest3 = Expect<
    Equal<
      InferResponsesForServer<typeof contract, 401>,
      {
        getPost: {
          status: 401;
          body: unknown;
        };
        createPost: {
          status: 401;
          body: unknown;
        };
        uploadImage: {
          status: 401;
          body: unknown;
        };
        nested: {
          getComments: {
            status: 401;
            body: unknown;
          };
        };
      }
    >
  >;

  type InferResponsesForClientTest = Expect<
    Equal<
      InferResponsesForClient<typeof contract>,
      {
        getPost:
          | {
              status: 200;
              body: { title: string; id: number; content: string };
            }
          | {
              status: 404;
              body: { message: string };
            }
          | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown };
        createPost:
          | {
              status: 201;
              body: { id: number; title: string; content: string };
            }
          | { status: Exclude<HTTPStatusCode, 201>; body: unknown };
        uploadImage:
          | {
              status: 201;
              body: { id: number; url: string };
            }
          | { status: Exclude<HTTPStatusCode, 201>; body: unknown };
        nested: {
          getComments:
            | {
                status: 200;
                body: { comments: { id: number; content: string }[] };
              }
            | { status: 404; body: { message: string } }
            | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown };
        };
      }
    >
  >;

  type InferResponseBodyForServerTest = Expect<
    Equal<
      InferResponseBodyForServer<typeof contract.getPost, 200>,
      { title?: string | undefined; id: number; content: string }
    >
  >;

  type InferResponseBodyForClientTest = Expect<
    Equal<
      InferResponseBodyForClient<typeof contract.getPost, 200>,
      { title: string; id: number; content: string }
    >
  >;

  type InferRequestForServerTest = Expect<
    Equal<
      InferRequestForServer<typeof contract>,
      {
        getPost: {
          query: { includeComments: boolean };
          params: { id: number };
        };
        createPost: {
          body: { title: string; content: string };
        };
        uploadImage: {
          // eslint-disable-next-line @typescript-eslint/ban-types
          body: {};
        };
        nested: {
          getComments: {
            params: { id: number };
          };
        };
      }
    >
  >;

  type InferRequestForClientTest = Expect<
    Equal<
      InferRequestForClient<typeof contract>,
      {
        getPost: {
          query: { includeComments?: boolean | undefined };
          params: { id: string };
        };
        createPost: {
          body: { title: string; content: string };
        };
        uploadImage: {
          body:
            | {
                image: File;
              }
            | FormData;
        };
        nested: {
          getComments: {
            params: { id: string };
          };
        };
      }
    >
  >;
});
