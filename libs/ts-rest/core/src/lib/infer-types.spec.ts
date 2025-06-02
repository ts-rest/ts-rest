import { z } from 'zod';
import { z as z4 } from 'zod4/v4';
import {
  UnknownOrUndefinedObjectValuesToOptionalKeys,
  initContract,
} from './dsl';
import { Equal, Expect } from './test-helpers';
import {
  ClientInferRequest,
  ServerInferRequest,
  ClientInferResponseBody,
  ServerInferResponseBody,
  ClientInferResponses,
  ServerInferResponses,
  InferResponseDefinedStatusCodes,
  InferResponseUndefinedStatusCodes,
} from './infer-types';
import {
  ErrorHttpStatusCode,
  HTTPStatusCode,
  SuccessfulHttpStatusCode,
} from './status-codes';
import { FetchOptions, OverrideableClientArgs, initClient } from './client';
import { Prettify } from './type-utils';
import * as v from 'valibot';

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
      body: c.type<{ image: File; images: File[] }>(),
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
  /**
   * @name ServerInferResponsesWithUnknownStatusCodes
   * Expect ServerInferResponses to include all defined status codes plus unknown status codes
   * for endpoints that don't have strict status codes enabled
   */
  type ServerInferResponsesWithUnknownStatusCodes = ServerInferResponses<
    typeof contract
  >;
  type TestServerInferResponsesWithUnknownStatusCodes = Expect<
    Equal<
      ServerInferResponsesWithUnknownStatusCodes,
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

  /**
   * @name ServerInferResponsesWithStrictStatusCodes
   * Expect ServerInferResponses to only include explicitly defined status codes
   * when strict status codes are enabled, excluding unknown status codes
   */
  type ServerInferResponsesWithStrictStatusCodes = ServerInferResponses<
    typeof contractStrict
  >;
  type TestServerInferResponsesWithStrictStatusCodes = Expect<
    Equal<
      ServerInferResponsesWithStrictStatusCodes,
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

  /**
   * @name ServerInferResponsesIgnoreStrictMode
   * Expect ServerInferResponses to include unknown status codes even when strict mode is enabled
   * but explicitly ignored via the 'ignore' parameter
   */
  type ServerInferResponsesIgnoreStrictMode = ServerInferResponses<
    typeof contractStrict,
    HTTPStatusCode,
    'ignore'
  >;
  type TestServerInferResponsesIgnoreStrictMode = Expect<
    Equal<
      ServerInferResponsesIgnoreStrictMode,
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

  /**
   * @name ServerInferResponsesSpecificStatusCode
   * Expect ServerInferResponses to filter responses to only include the specified status code (200),
   * returning unknown body for endpoints that don't define that status code
   */
  type ServerInferResponsesSpecificStatusCode = ServerInferResponses<
    typeof contract,
    200
  >;
  type TestServerInferResponsesSpecificStatusCode = Expect<
    Equal<
      ServerInferResponsesSpecificStatusCode,
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

  /**
   * @name ServerInferResponsesUndefinedStatusCode
   * Expect ServerInferResponses to return unknown body for all endpoints
   * when filtering by a status code (401) that is not defined in any endpoint
   */
  type ServerInferResponsesUndefinedStatusCode = ServerInferResponses<
    typeof contract,
    401
  >;
  type TestServerInferResponsesUndefinedStatusCode = Expect<
    Equal<
      ServerInferResponsesUndefinedStatusCode,
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

  /**
   * @name ServerInferResponsesErrorStatusCodes
   * Expect ServerInferResponses to filter responses to only include error status codes,
   * showing defined error responses and unknown for undefined error codes
   */
  type ServerInferResponsesErrorStatusCodes = ServerInferResponses<
    typeof contractStrict,
    ErrorHttpStatusCode,
    'ignore'
  >;
  type TestServerInferResponsesErrorStatusCodes = Expect<
    Equal<
      ServerInferResponsesErrorStatusCodes,
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

  /**
   * @name ServerInferResponsesSuccessStatusCodesForced
   * Expect ServerInferResponses to only include successful status codes when forced,
   * filtering out error responses and unknown status codes
   */
  type ServerInferResponsesSuccessStatusCodesForced = ServerInferResponses<
    typeof contract,
    SuccessfulHttpStatusCode,
    'force'
  >;
  type TestServerInferResponsesSuccessStatusCodesForced = Expect<
    Equal<
      ServerInferResponsesSuccessStatusCodesForced,
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

  /**
   * @name ClientInferResponsesWithHeaders
   * Expect ClientInferResponses to include Headers object in all response types,
   * distinguishing client-side responses from server-side responses
   */
  type ClientInferResponsesWithHeaders = ClientInferResponses<typeof contract>;
  type TestClientInferResponsesWithHeaders = Expect<
    Equal<
      ClientInferResponsesWithHeaders,
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

  /**
   * @name ServerInferResponseBodySpecificEndpoint
   * Expect ServerInferResponseBody to extract the response body type for a specific endpoint and status code,
   * including optional properties from Zod defaults
   */
  type ServerInferResponseBodySpecificEndpoint = ServerInferResponseBody<
    typeof contract.getPost,
    200
  >;
  type TestServerInferResponseBodySpecificEndpoint = Expect<
    Equal<
      ServerInferResponseBodySpecificEndpoint,
      { title?: string | undefined; id: number; content: string }
    >
  >;

  /**
   * @name ClientInferResponseBodySpecificEndpoint
   * Expect ClientInferResponseBody to extract the response body type for a specific endpoint and status code,
   * with required properties (no optional from Zod defaults on client side)
   */
  type ClientInferResponseBodySpecificEndpoint = ClientInferResponseBody<
    typeof contract.getPost,
    200
  >;
  type TestClientInferResponseBodySpecificEndpoint = Expect<
    Equal<
      ClientInferResponseBodySpecificEndpoint,
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

  /**
   * @name ClientInferResponseBodyWithCommonResponses
   * Expect ClientInferResponseBody to work with common response definitions,
   * extracting the correct body type from shared response schemas
   */
  type ClientInferResponseBodyWithCommonResponses = ClientInferResponseBody<
    typeof contractWithCommonErrors.get,
    400
  >;
  type TestClientInferResponseBodyWithCommonResponses = Expect<
    Equal<ClientInferResponseBodyWithCommonResponses, { message: string }>
  >;

  /**
   * @name ServerInferRequestWithTransforms
   * Expect ServerInferRequest to include transformed types for path params and headers,
   * showing how Zod transforms affect the inferred server-side types
   */
  type ServerInferRequestWithTransforms = ServerInferRequest<typeof contract>;
  type TestServerInferRequestWithTransforms = Expect<
    Equal<
      ServerInferRequestWithTransforms,
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

  /**
   * @name ServerInferRequestWithOverriddenHeaders
   * Expect ServerInferRequest to merge contract headers with overridden server headers,
   * allowing server-specific header types to be injected
   */
  type ServerInferRequestWithOverriddenHeaders = ServerInferRequest<
    typeof contract,
    {
      authorization: string | undefined;
      age: string | undefined;
      'content-type': string | undefined;
    }
  >;
  type TestServerInferRequestWithOverriddenHeaders = Expect<
    Equal<
      ServerInferRequestWithOverriddenHeaders,
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

  /**
   * @name ClientInferRequestWithClientOptions
   * Expect ClientInferRequest to include client-specific options like fetchOptions and extraHeaders,
   * showing the difference between client and server request inference
   */
  type ClientInferRequestWithClientOptions = ClientInferRequest<
    typeof contract
  >;
  type TestClientInferRequestWithClientOptions = Expect<
    Equal<
      ClientInferRequestWithClientOptions,
      {
        getPost: {
          query: { includeComments?: boolean | undefined };
          params: { id: string };
          headers: { authorization: string; age?: number };
          extraHeaders?: {
            authorization?: undefined;
            age?: undefined;
          } & Record<string, string>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: FetchOptions['cache'];
        };
        createPost: {
          body: { title: string; content: string };
          headers: { authorization: string; age?: number };
          extraHeaders?: {
            authorization?: undefined;
            age?: undefined;
          } & Record<string, string>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: FetchOptions['cache'];
        };
        uploadImage: {
          body:
            | {
                image: File;
                images: File[];
              }
            | FormData;
          headers: { authorization: string; age?: number };
          extraHeaders?: {
            authorization?: undefined;
            age?: undefined;
          } & Record<string, string>;
          fetchOptions?: FetchOptions;
          overrideClientOptions?: Partial<OverrideableClientArgs>;
          cache?: FetchOptions['cache'];
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
            } & Record<string, string>;
            fetchOptions?: FetchOptions;
            overrideClientOptions?: Partial<OverrideableClientArgs>;
            cache?: FetchOptions['cache'];
          };
        };
      }
    >
  >;

  /**
   * @name ClientInferRequestWithoutBaseHeaders
   * Expect ClientInferRequest to only include extraHeaders when no base headers are defined,
   * demonstrating how base headers affect the client request interface
   */
  type ClientInferRequestWithoutBaseHeaders = Omit<
    ClientInferRequest<typeof headerlessContract>['getPost'],
    'next'
  >;
  type TestClientInferRequestWithoutBaseHeaders = Expect<
    Equal<
      ClientInferRequestWithoutBaseHeaders,
      {
        query: { includeComments?: boolean | undefined };
        params: { id: string };
        extraHeaders?: Record<string, string>;
        fetchOptions?: FetchOptions;
        overrideClientOptions?: Partial<OverrideableClientArgs>;
        cache?: FetchOptions['cache'];
      }
    >
  >;

  /**
   * @name InferResponseDefinedStatusCodesBasic
   * Expect InferResponseDefinedStatusCodes to extract all explicitly defined status codes
   * from an endpoint's response definitions
   */
  type InferResponseDefinedStatusCodesBasic = InferResponseDefinedStatusCodes<
    typeof contract.getPost
  >;
  type TestInferResponseDefinedStatusCodesBasic = Expect<
    Equal<InferResponseDefinedStatusCodesBasic, 200 | 404>
  >;

  /**
   * @name InferResponseDefinedStatusCodesFiltered
   * Expect InferResponseDefinedStatusCodes to filter defined status codes by a specific type,
   * only returning successful status codes that are explicitly defined
   */
  type InferResponseDefinedStatusCodesFiltered =
    InferResponseDefinedStatusCodes<
      typeof contract.getPost,
      SuccessfulHttpStatusCode
    >;
  type TestInferResponseDefinedStatusCodesFiltered = Expect<
    Equal<InferResponseDefinedStatusCodesFiltered, 200>
  >;

  /**
   * @name InferResponseDefinedStatusCodesErrorsOnly
   * Expect InferResponseDefinedStatusCodes to filter defined status codes by error type,
   * only returning error status codes that are explicitly defined
   */
  type InferResponseDefinedStatusCodesErrorsOnly =
    InferResponseDefinedStatusCodes<
      typeof contract.getPost,
      ErrorHttpStatusCode
    >;
  type TestInferResponseDefinedStatusCodesErrorsOnly = Expect<
    Equal<InferResponseDefinedStatusCodesErrorsOnly, 404>
  >;

  /**
   * @name InferResponseUndefinedStatusCodesBasic
   * Expect InferResponseUndefinedStatusCodes to extract all status codes that are NOT explicitly defined,
   * representing the complement of defined status codes
   */
  type InferResponseUndefinedStatusCodesBasic =
    InferResponseUndefinedStatusCodes<typeof contract.getPost>;
  type TestInferResponseUndefinedStatusCodesBasic = Expect<
    Equal<
      InferResponseUndefinedStatusCodesBasic,
      Exclude<HTTPStatusCode, 200 | 404>
    >
  >;

  /**
   * @name InferResponseUndefinedStatusCodesSuccessFiltered
   * Expect InferResponseUndefinedStatusCodes to extract undefined successful status codes,
   * showing which successful codes are not explicitly defined in the endpoint
   */
  type InferResponseUndefinedStatusCodesSuccessFiltered =
    InferResponseUndefinedStatusCodes<
      typeof contract.getPost,
      SuccessfulHttpStatusCode
    >;
  type TestInferResponseUndefinedStatusCodesSuccessFiltered = Expect<
    Equal<
      InferResponseUndefinedStatusCodesSuccessFiltered,
      Exclude<SuccessfulHttpStatusCode, 200>
    >
  >;

  /**
   * @name InferResponseUndefinedStatusCodesErrorFiltered
   * Expect InferResponseUndefinedStatusCodes to extract undefined error status codes,
   * showing which error codes are not explicitly defined in the endpoint
   */
  type InferResponseUndefinedStatusCodesErrorFiltered =
    InferResponseUndefinedStatusCodes<
      typeof contract.getPost,
      ErrorHttpStatusCode
    >;
  type TestInferResponseUndefinedStatusCodesErrorFiltered = Expect<
    Equal<
      InferResponseUndefinedStatusCodesErrorFiltered,
      Exclude<ErrorHttpStatusCode, 404>
    >
  >;
});

describe('ClientInferRequest', () => {
  it('standard schema - optional headers', () => {
    const contract = c.router({
      getPost: {
        method: 'GET',
        path: '/post',
        headers: {
          'x-foo': v.optional(v.string()),
        },
        responses: {
          200: c.noBody(),
        },
      },
    });

    const client = initClient(contract, { baseUrl: '' });
    client.getPost({ headers: { 'x-foo': 'string' } });

    type Actual = ClientInferRequest<typeof contract.getPost>['headers'];
    type TestResult = Expect<
      Equal<
        Actual,
        {
          'x-foo'?: string | undefined;
        }
      >
    >;
  });

  it('headers zod coerce', () => {
    const contract = c.router({
      getPost: {
        method: 'GET',
        path: '/post',
        headers: {
          'x-foo': z.coerce.number().optional(),
        },
        responses: {
          200: c.noBody(),
        },
      },
    });

    const client = initClient(contract, { baseUrl: '' });
    client.getPost({ headers: { 'x-foo': 1 } });

    type Actual = ClientInferRequest<typeof contract.getPost>['headers'];
    type TestResult = Expect<Equal<Actual, { 'x-foo'?: number | undefined }>>;
  });

  it('headers zod (4) coerce', () => {
    const contract = c.router({
      getPost: {
        method: 'GET',
        path: '/posts',
        headers: {
          'x-foo': z4.coerce.number().optional(),
        },
        responses: {
          200: c.noBody(),
        },
      },
    });

    const client = initClient(contract, { baseUrl: '' });
    client.getPost({ headers: { 'x-foo': 1 } });

    type Actual = ClientInferRequest<typeof contract.getPost>['headers'];
    type TestResult = Expect<Equal<Actual, { 'x-foo'?: unknown }>>;
  });

  it('headers zod (4) union sometimes undefined', () => {
    const contract = c.router({
      getPost: {
        method: 'GET',
        path: '/posts',
        headers: {
          'x-foo': z4.union([
            z4.string(),
            z4.number(),
            z4.null(),
            z4.undefined(),
          ]),
          'x-required': z4.union([z4.string(), z4.number(), z4.null()]),
        },
        responses: {
          200: c.noBody(),
        },
      },
    });

    type Actual = ClientInferRequest<typeof contract.getPost>['headers'];
    type TestResult = Expect<
      Equal<
        Actual,
        {
          'x-foo'?: string | number | null | undefined; // <- this one becomes optional as it contains undefined
          'x-required': string | number | null;
        }
      >
    >;
  });
});

describe('UnknownOrUndefinedObjectValuesToOptionalKeys', () => {
  it('should make undefined key optional', () => {
    type Actual = Prettify<
      UnknownOrUndefinedObjectValuesToOptionalKeys<{
        foo: string | undefined;
      }>
    >;
    type Assert = Expect<Equal<Actual, { foo?: string | undefined }>>;
  });

  it('should make unknown key optional', () => {
    type Actual = Prettify<
      UnknownOrUndefinedObjectValuesToOptionalKeys<{
        foo: unknown;
      }>
    >;
    type Assert = Expect<Equal<Actual, { foo?: unknown }>>;
  });

  it('should not affect a non-empty object', () => {
    type Actual = Prettify<
      UnknownOrUndefinedObjectValuesToOptionalKeys<{
        foo: string;
      }>
    >;
    type Assert = Expect<Equal<Actual, { foo: string }>>;
  });

  it('should not affect an empty object', () => {
    type Actual = Prettify<UnknownOrUndefinedObjectValuesToOptionalKeys<{}>>;
    type Assert = Expect<Equal<Actual, {}>>;
  });
});
