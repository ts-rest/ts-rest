import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { generateOpenApi } from './ts-rest-open-api';

const c = initContract();

type Post = {
  title: string;
  published: boolean;
};

const commentSchema = z.object({
  id: z.number(),
  title: z.string(),
});

const postsRouter = c.router({
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: c.type<Post | null>(),
    },
  },
  findPosts: {
    method: 'GET',
    path: `/posts`,
    query: z.object({
      search: z.string().nullish(),
      sortBy: z.enum(['title', 'date']).default('date').optional(),
      sort: z.enum(['asc', 'desc']).default('asc').optional(),
      obj: z.object({
        a: z.string(),
      }),
    }),
    responses: {
      200: c.type<Post[]>(),
    },
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    deprecated: true,
    responses: {
      200: c.type<Post>(),
    },
    body: z.object({
      title: z.string(),
      published: z.boolean().optional(),
    }),
  },
  comments: c.router({
    getPostComments: {
      method: 'GET',
      path: '/posts/:id/comments',
      responses: {
        200: z.object({
          booleanString: z.boolean().transform((v) => v.toString()),
          comments: z.union([
            z.array(commentSchema),
            z.array(commentSchema.extend({ author: z.string() })),
          ]),
        }),
      },
    },
  }),
  getPostComment: {
    method: 'GET',
    path: `/posts/:id/comments/:commentId`,
    pathParams: z.object({
      commentId: z.string().length(5).describe("the comment ID"),
    }),
    responses: {
      200: c.type<Post | null>(),
    },
  },
  auth: {
    method: 'POST',
    path: '/auth',
    deprecated: undefined,
    responses: {
      200: c.type<string>(),
    },
    headers: z.object({
      'x-client-id': z.string(),
      'x-api-key': z.string(),
      'x-tenant-id': z.string().optional(),
    }),
    body: z.never(),
  },
});

const router = c.router({
  posts: postsRouter,
  health: {
    method: 'GET',
    path: '/health',
    summary: 'Health API',
    description: `Check the application's health status`,
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
});

const expectedApiDoc = {
  info: {
    title: 'Blog API',
    version: '0.1',
  },
  openapi: '3.0.2',
  paths: {
    '/health': {
      get: {
        deprecated: undefined,
        description: "Check the application's health status",
        parameters: [],
        responses: {
          '200': {
            description: '200',
          },
        },
        summary: 'Health API',
        tags: [],
      },
    },
    '/posts': {
      get: {
        deprecated: undefined,
        description: undefined,
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: {
              nullable: true,
              type: 'string',
            },
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              default: 'date',
              enum: ['title', 'date'],
            },
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              default: 'asc',
              enum: ['asc', 'desc'],
            },
          },
          {
            in: 'query',
            name: 'obj',
            required: true,
            style: 'deepObject',
            schema: {
              properties: {
                a: {
                  type: 'string',
                },
              },
              required: ['a'],
              type: 'object',
            },
          },
        ],
        responses: {
          '200': {
            description: '200',
          },
        },
        summary: undefined,
        tags: ['posts'],
      },
      post: {
        deprecated: true,
        description: undefined,
        parameters: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  published: {
                    type: 'boolean',
                  },
                  title: {
                    type: 'string',
                  },
                },
                required: ['title'],
                type: 'object',
              },
            },
          },
          description: 'Body',
        },
        responses: {
          '200': {
            description: '200',
          },
        },
        summary: undefined,
        tags: ['posts'],
      },
    },
    '/posts/{id}': {
      get: {
        deprecated: undefined,
        description: undefined,
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: '200',
          },
        },
        summary: undefined,
        tags: ['posts'],
      },
    },
    '/posts/{id}/comments': {
      get: {
        deprecated: undefined,
        description: undefined,
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  properties: {
                    comments: {
                      oneOf: [
                        {
                          items: {
                            properties: {
                              id: {
                                type: 'number',
                              },
                              title: {
                                type: 'string',
                              },
                            },
                            required: ['id', 'title'],
                            type: 'object',
                          },
                          type: 'array',
                        },
                        {
                          items: {
                            properties: {
                              author: {
                                type: 'string',
                              },
                              id: {
                                type: 'number',
                              },
                              title: {
                                type: 'string',
                              },
                            },
                            required: ['id', 'title', 'author'],
                            type: 'object',
                          },
                          type: 'array',
                        },
                      ],
                    },
                    booleanString: {
                      type: 'string',
                    },
                  },
                  required: ['booleanString', 'comments'],
                  type: 'object',
                },
              },
            },
            description: '200',
          },
        },
        summary: undefined,
        tags: ['posts', 'comments'],
      },
    },
    '/posts/{id}/comments/{commentId}': {
      get: {
        deprecated: undefined,
        description: undefined,
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string',
            },
          },
          {
            in: 'path',
            name: 'commentId',
            required: true,
            description: 'the comment ID',
            schema: {
              type: 'string',
              minLength: 5,
              maxLength: 5,
            },
          },
        ],
        responses: {
          '200': {
            description: '200',
          },
        },
        summary: undefined,
        tags: ['posts'],
      },
    },
    '/auth': {
      post: {
        deprecated: undefined,
        description: undefined,
        parameters: [
          {
            name: 'x-client-id',
            in: 'header',
            schema: {
              type: 'string',
            },
            required: true,
          },
          {
            name: 'x-api-key',
            in: 'header',
            schema: {
              type: 'string',
            },
            required: true,
          },
          {
            name: 'x-tenant-id',
            in: 'header',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          description: 'Body',
          content: {
            'application/json': {
              schema: {
                readOnly: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: '200',
          },
        },
        summary: undefined,
        tags: ['posts'],
      },
    },
  },
};

describe('ts-rest-open-api', () => {
  describe('generateOpenApi', () => {
    it('should generate doc with defaults', async () => {
      const apiDoc = generateOpenApi(router, {
        info: { title: 'Blog API', version: '0.1' },
      });

      expect(apiDoc).toStrictEqual(expectedApiDoc);
    });

    it('should generate doc with operation ids', async () => {
      const apiDoc = generateOpenApi(
        router,
        {
          info: { title: 'Blog API', version: '0.1' },
        },
        { setOperationId: true }
      );

      expect(apiDoc).toEqual({
        ...expectedApiDoc,
        paths: {
          '/health': {
            get: {
              ...expectedApiDoc.paths['/health'].get,
              operationId: 'health',
            },
          },
          '/posts': {
            get: {
              ...expectedApiDoc.paths['/posts'].get,
              operationId: 'findPosts',
            },
            post: {
              ...expectedApiDoc.paths['/posts'].post,
              operationId: 'createPost',
            },
          },
          '/posts/{id}': {
            get: {
              ...expectedApiDoc.paths['/posts/{id}'].get,
              operationId: 'getPost',
            },
          },
          '/posts/{id}/comments': {
            get: {
              ...expectedApiDoc.paths['/posts/{id}/comments'].get,
              operationId: 'getPostComments',
            },
          },
          '/posts/{id}/comments/{commentId}': {
            get: {
              ...expectedApiDoc.paths['/posts/{id}/comments/{commentId}'].get,
              operationId: 'getPostComment',
            },
          },
          '/auth': {
            post: {
              ...expectedApiDoc.paths['/auth'].post,
              operationId: 'auth',
            },
          },
        },
      });
    });

    it('should generate doc with json query', async () => {
      const apiDoc = generateOpenApi(
        router,
        {
          info: { title: 'Blog API', version: '0.1' },
        },
        { jsonQuery: true }
      );

      expect(apiDoc).toEqual({
        ...expectedApiDoc,
        paths: {
          ...expectedApiDoc.paths,
          '/posts': {
            ...expectedApiDoc.paths['/posts'],
            get: {
              ...expectedApiDoc.paths['/posts'].get,
              parameters: [
                {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                  },
                  in: 'query',
                  name: 'search',
                },
                {
                  content: {
                    'application/json': {
                      schema: {
                        default: 'date',
                        enum: ['title', 'date'],
                        type: 'string',
                      },
                    },
                  },
                  in: 'query',
                  name: 'sortBy',
                },
                {
                  content: {
                    'application/json': {
                      schema: {
                        default: 'asc',
                        enum: ['asc', 'desc'],
                        type: 'string',
                      },
                    },
                  },
                  in: 'query',
                  name: 'sort',
                },
                {
                  content: {
                    'application/json': {
                      schema: {
                        properties: {
                          a: {
                            type: 'string',
                          },
                        },
                        required: ['a'],
                        type: 'object',
                      },
                    },
                  },
                  in: 'query',
                  name: 'obj',
                  required: true,
                },
              ],
            },
          },
        },
      });
    });

    it('should throw when duplicate operationIds', async () => {
      const router = c.router({
        posts: postsRouter,
        getPost: {
          method: 'GET',
          path: `/posts/:id`,
          responses: {
            200: c.type<Post | null>(),
          },
        },
      });

      expect(() =>
        generateOpenApi(
          router,
          {
            info: { title: 'Blog API', version: '0.1' },
          },
          { setOperationId: true }
        )
      ).toThrowError(/getPost/);
    });

    it('works with zod refine', () => {
      const routerWithRefine = c.router({
        endpointWithZodRefine: {
          method: 'GET',
          path: '/refine',
          responses: {
            200: c.type<null>(),
          },
          query: z
            .object({
              foo: z.string().describe("Foo"),
            })
            .refine((v) => v.foo === 'bar', {
              message: 'foo must be bar',
            }),
        },
      });

      const schema = generateOpenApi(routerWithRefine, {
        info: { title: 'Blog API', version: '0.1' },
      });

      expect(schema).toEqual({
        info: {
          title: 'Blog API',
          version: '0.1',
        },
        openapi: '3.0.2',
        paths: {
          '/refine': {
            get: {
              deprecated: undefined,
              description: undefined,
              parameters: [
                {
                  description: 'Foo',
                  in: 'query',
                  name: 'foo',
                  required: true,
                  schema: {
                    type: 'string',
                  },
                },
              ],
              responses: {
                '200': {
                  description: '200',
                },
              },
              summary: undefined,
              tags: [],
            },
          },
        },
      });
    });

    it('works with zod transform', () => {
      const routerWithTransform = c.router({
        endpointWithZodTransform: {
          method: 'GET',
          path: '/transform',
          responses: {
            200: c.type<null>(),
          },
          query: z
            .object({
              foo: z.string(),
            })
            .transform((v) => ({ fooTransformed: v.foo })),
        },
      });

      const schema = generateOpenApi(routerWithTransform, {
        info: { title: 'Blog API', version: '0.1' },
      });

      expect(schema).toEqual({
        info: {
          title: 'Blog API',
          version: '0.1',
        },
        openapi: '3.0.2',
        paths: {
          '/transform': {
            get: {
              deprecated: undefined,
              description: undefined,
              parameters: [
                {
                  in: 'query',
                  name: 'foo',
                  required: true,
                  schema: {
                    type: 'string',
                  },
                },
              ],
              responses: {
                '200': {
                  description: '200',
                },
              },
              summary: undefined,
              tags: [],
            },
          },
        },
      });
    });
  });
});
