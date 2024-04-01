import { z } from 'zod';
import { initContract } from './dsl';
import { Equal, Expect } from './test-helpers';
import {
  ClientInferRequest,
  ServerInferRequest,
  ClientInferResponseBody,
  ServerInferResponseBody,
  ClientInferResponses,
  ServerInferResponses,
} from './infer-types';
import {
  ErrorHttpStatusCode,
  HTTPStatusCode,
  SuccessfulHttpStatusCode,
} from './status-codes';
import { FetchOptions, OverrideableClientArgs } from './client';

const c = initContract();

const contract = c.router(
  {
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
        201: c.otherResponse({
          contentType: 'text/plain',
          body: c.type<'Image uploaded successfully'>(),
        }),
        500: c.otherResponse({
          contentType: 'text/plain',
          body: z.literal('Image upload failed'),
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
        headers: z.object({
          'pagination-page': z.string().transform(Number),
        }),
        responses: {
          200: z.object({
            comments: z.array(
              z.object({
                id: z.number(),
                content: z.string(),
              }),
            ),
          }),
          404: c.type<null>(),
        },
      },
    },
  },
  {
    baseHeaders: z.object({
      Authorization: z.string(),
      age: z.coerce.number().optional(),
    }),
  },
);

const contractStrict = c.router(contract, {
  strictStatusCodes: true,
});

const headerlessContract = c.router({
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
});

it('type inference helpers', () => {
  type ServerInferResponsesTest = Expect<
    Equal<
      ServerInferResponses<typeof contract>,
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
              body: 'Image uploaded successfully';
            }
          | {
              status: 500;
              body: 'Image upload failed';
            }
          | { status: Exclude<HTTPStatusCode, 201 | 500>; body: unknown };
        nested: {
          getComments:
            | {
                status: 200;
                body: { comments: { id: number; content: string }[] };
              }
            | { status: 404; body: null }
            | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown };
        };
      }
    >
  >;

  type ServerInferResponsesStrictTest = Expect<
    Equal<
      ServerInferResponses<typeof contractStrict>,
      {
        getPost:
          | {
              status: 200;
              body: { title?: string | undefined; id: number; content: string };
            }
          | { status: 404; body: { message: string } };
        createPost: {
          status: 201;
          body: { id: number; title: string; content: string };
        };
        uploadImage:
          | {
              status: 201;
              body: 'Image uploaded successfully';
            }
          | {
              status: 500;
              body: 'Image upload failed';
            };
        nested: {
          getComments:
            | {
                status: 200;
                body: { comments: { id: number; content: string }[] };
              }
            | { status: 404; body: null };
        };
      }
    >
  >;

  type ServerInferResponsesIgnoreStrictTest = Expect<
    Equal<
      ServerInferResponses<typeof contractStrict, HTTPStatusCode, 'ignore'>,
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
              body: 'Image uploaded successfully';
            }
          | {
              status: 500;
              body: 'Image upload failed';
            }
          | { status: Exclude<HTTPStatusCode, 201 | 500>; body: unknown };
        nested: {
          getComments:
            | {
                status: 200;
                body: { comments: { id: number; content: string }[] };
              }
            | { status: 404; body: null }
            | { status: Exclude<HTTPStatusCode, 200 | 404>; body: unknown };
        };
      }
    >
  >;

  type ServerInferResponsesTest2 = Expect<
    Equal<
      ServerInferResponses<typeof contract, 200>,
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

  type ServerInferResponsesTest3 = Expect<
    Equal<
      ServerInferResponses<typeof contract, 401>,
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

  type ServerInferResponsesErrorsTest = Expect<
    Equal<
      ServerInferResponses<
        typeof contractStrict,
        ErrorHttpStatusCode,
        'ignore'
      >,
      {
        getPost:
          | { status: 404; body: { message: string } }
          | { status: Exclude<ErrorHttpStatusCode, 404>; body: unknown };
        createPost: { status: ErrorHttpStatusCode; body: unknown };
        uploadImage:
          | {
              status: 500;
              body: 'Image upload failed';
            }
          | { status: Exclude<ErrorHttpStatusCode, 500>; body: unknown };
        nested: {
          getComments:
            | { status: 404; body: null }
            | { status: Exclude<ErrorHttpStatusCode, 404>; body: unknown };
        };
      }
    >
  >;

  type ServerInferResponsesSuccessForceTest = Expect<
    Equal<
      ServerInferResponses<typeof contract, SuccessfulHttpStatusCode, 'force'>,
      {
        getPost: {
          status: 200;
          body: { title?: string | undefined; id: number; content: string };
        };
        createPost: {
          status: 201;
          body: { id: number; title: string; content: string };
        };
        uploadImage: {
          status: 201;
          body: 'Image uploaded successfully';
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

  type ClientInferResponsesTest = Expect<
    Equal<
      ClientInferResponses<typeof contract>,
      {
        getPost:
          | {
              status: 200;
              body: { title: string; id: number; content: string };
              headers: Headers;
            }
          | {
              status: 404;
              body: { message: string };
              headers: Headers;
            }
          | {
              status: Exclude<HTTPStatusCode, 200 | 404>;
              body: unknown;
              headers: Headers;
            };
        createPost:
          | {
              status: 201;
              body: { id: number; title: string; content: string };
              headers: Headers;
            }
          | {
              status: Exclude<HTTPStatusCode, 201>;
              body: unknown;
              headers: Headers;
            };
        uploadImage:
          | {
              status: 201;
              body: 'Image uploaded successfully';
              headers: Headers;
            }
          | {
              status: 500;
              body: 'Image upload failed';
              headers: Headers;
            }
          | {
              status: Exclude<HTTPStatusCode, 201 | 500>;
              body: unknown;
              headers: Headers;
            };
        nested: {
          getComments:
            | {
                status: 200;
                body: { comments: { id: number; content: string }[] };
                headers: Headers;
              }
            | {
                status: 404;
                body: null;
                headers: Headers;
              }
            | {
                status: Exclude<HTTPStatusCode, 200 | 404>;
                body: unknown;
                headers: Headers;
              };
        };
      }
    >
  >;

  type ServerInferResponseBodyTest = Expect<
    Equal<
      ServerInferResponseBody<typeof contract.getPost, 200>,
      { title?: string | undefined; id: number; content: string }
    >
  >;

  type ClientInferResponseBodyTest = Expect<
    Equal<
      ClientInferResponseBody<typeof contract.getPost, 200>,
      { title: string; id: number; content: string }
    >
  >;

  const commonErrors = c.responses({
    400: c.type<{ message: string }>(),
  });

  const contractWithCommonErrors = c.router({
    get: {
      method: 'GET',
      path: '/',
      responses: {
        ...commonErrors,
      },
    },
  });

  type ClientInferResponseBodyCommonResponsesTest = Expect<
    Equal<
      ClientInferResponseBody<typeof contractWithCommonErrors.get, 400>,
      { message: string }
    >
  >;

  type ServerInferRequestTest = Expect<
    Equal<
      ServerInferRequest<typeof contract>,
      {
        getPost: {
          query: { includeComments: boolean };
          params: { id: number };
          headers: { authorization: string; age?: number };
        };
        createPost: {
          body: { title: string; content: string };
          headers: { authorization: string; age?: number };
        };
        uploadImage: {
          body: {};
          headers: { authorization: string; age?: number };
        };
        nested: {
          getComments: {
            params: { id: number };
            headers: {
              authorization: string;
              'pagination-page': number;
              age?: number;
            };
          };
        };
      }
    >
  >;

  type ServerInferRequestOverrideServerHeadersTest = Expect<
    Equal<
      ServerInferRequest<
        typeof contract,
        {
          authorization: string | undefined;
          age: string | undefined;
          'content-type': string | undefined;
        }
      >,
      {
        getPost: {
          query: { includeComments: boolean };
          params: { id: number };
          headers: {
            authorization: string;
            age?: number;
            'content-type': string | undefined;
          };
        };
        createPost: {
          body: { title: string; content: string };
          headers: {
            authorization: string;
            age?: number;
            'content-type': string | undefined;
          };
        };
        uploadImage: {
          body: {};
          headers: {
            authorization: string;
            age?: number;
            'content-type': string | undefined;
          };
        };
        nested: {
          getComments: {
            params: { id: number };
            headers: {
              authorization: string;
              'pagination-page': number;
              age?: number;
              'content-type': string | undefined;
            };
          };
        };
      }
    >
  >;

  type ClientInferRequestTest = Expect<
    Equal<
      ClientInferRequest<typeof contract>,
      {
        getPost: {
          query: { includeComments?: boolean | undefined };
          params: { id: string };
          headers: { authorization: string; age?: number };
          extraHeaders?: {
            authorization?: undefined;
            age?: undefined;
          } & Record<string, string | undefined>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: RequestCache;
        };
        createPost: {
          body: { title: string; content: string };
          headers: { authorization: string; age?: number };
          extraHeaders?: {
            authorization?: undefined;
            age?: undefined;
          } & Record<string, string | undefined>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: RequestCache;
        };
        uploadImage: {
          body:
            | {
                image: File;
              }
            | FormData;
          headers: { authorization: string; age?: number };
          extraHeaders?: {
            authorization?: undefined;
            age?: undefined;
          } & Record<string, string | undefined>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: RequestCache;
        };
        nested: {
          getComments: {
            params: { id: string };
            headers: {
              authorization: string;
              'pagination-page': string;
              age?: number;
            };
            extraHeaders?: {
              authorization?: undefined;
              'pagination-page'?: undefined;
              age?: undefined;
            } & Record<string, string | undefined>;
            fetchOptions?: FetchOptions;
            overrideClientOptions?: Partial<OverrideableClientArgs>;
            cache?: RequestCache;
          };
        };
      }
    >
  >;

  type ClientInferRequestHeaderlessTest = Expect<
    Equal<
      ClientInferRequest<typeof headerlessContract>,
      {
        getPost: {
          query: { includeComments?: boolean | undefined };
          params: { id: string };
          extraHeaders?: Record<string, string | undefined>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: RequestCache;
        };
      }
    >
  >;
});
