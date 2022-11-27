import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { generateOpenApi } from './ts-rest-open-api';

const c = initContract();

type Post = {
  title: string;
  published: boolean;
};

const postsRouter = c.router({
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: c.response<Post | null>(),
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
        parameters: undefined,
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
      post: {
        deprecated: true,
        description: undefined,
        parameters: undefined,
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
