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
      200: c.response<Post | null>(),
    },
  },
  findPosts: {
    method: 'GET',
    path: `/posts`,
    query: z.object({
      search: z.string().optional(),
      sortBy: z.enum(['title', 'date']).default('date').optional(),
      sort: z.enum(['asc', 'desc']).default('asc').optional(),
    }),
    responses: {
      200: c.response<Post[]>(),
    },
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    deprecated: true,
    responses: {
      200: c.response<Post>(),
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
          comments: z.union([
            z.array(commentSchema),
            z.array(commentSchema.extend({ author: z.string() })),
          ]),
        }),
      },
    },
  }),
});

const router = c.router({
  posts: postsRouter,
  health: {
    method: 'GET',
    path: '/health',
    summary: 'Health API',
    description: `Check the application's health status`,
    responses: {
      200: c.response<{ message: string }>(),
    },
  },
});

const expectedApiDoc = {
  info: {
    title: 'Blog API',
    version: '0.1',
  },
  openapi: '3.0.0',
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
            name: 'query',
            in: 'query',
            schema: {
              additionalProperties: false,
              properties: {
                search: {
                  type: 'string',
                },
                sortBy: {
                  type: 'string',
                  default: 'date',
                  enum: ['title', 'date'],
                },
                sort: {
                  type: 'string',
                  default: 'asc',
                  enum: ['asc', 'desc'],
                },
              },
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
                additionalProperties: false,
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
          },
        ],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  additionalProperties: false,
                  properties: {
                    comments: {
                      anyOf: [
                        {
                          items: {
                            additionalProperties: false,
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
                            additionalProperties: false,
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
                  },
                  required: ['comments'],
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
            200: c.response<Post | null>(),
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
  });
});
