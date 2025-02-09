import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export interface Post {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  published: boolean;
  tags: string[];
}

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  published: z.boolean(),
  tags: z.array(z.string()),
});

const c = initContract();

export const apiBlog = c.router(
  {
    createPost: {
      method: 'POST',
      path: '/posts',
      responses: {
        201: PostSchema,
        400: z.object({ message: z.string() }),
      },
      body: z.object({
        title: z.string().transform((v) => v.trim()),
        content: z.string(),
        published: z.boolean().optional(),
        description: z.string().optional(),
      }),
      summary: 'Create a post',
      metadata: { roles: ['user'] } as const,
    },
    updatePost: {
      method: 'PATCH',
      path: `/posts/:id`,
      responses: { 200: PostSchema },
      body: z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        published: z.boolean().optional(),
        description: z.string().optional(),
      }),
      summary: 'Update a post',
      metadata: {
        roles: ['user'],
        resource: 'post',
        identifierPath: 'params.id',
      } as const,
    },
    deletePost: {
      method: 'DELETE',
      path: `/posts/:id`,
      responses: {
        200: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      summary: 'Delete a post',
      metadata: {
        roles: ['user'],
        resource: 'post',
        identifierPath: 'params.id',
      } as const,
    },
    getPost: {
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: PostSchema,
        404: z.null(),
      },
      query: null,
      summary: 'Get a post by id',
      metadata: { roles: ['guest', 'user'] } as const,
    },
    getPosts: {
      method: 'GET',
      path: '/posts',
      responses: {
        200: z.object({
          posts: PostSchema.array(),
          count: z.number(),
          skip: z.number(),
          take: z.number(),
        }),
      },
      query: z.object({
        take: z.string().transform(Number),
        skip: z.string().transform(Number),
        search: z.string().optional(),
      }),
      summary: 'Get all posts!',
      headers: z.object({
        'x-pagination': z.coerce.number().optional(),
      }),
      metadata: { roles: ['guest', 'user'] } as const,
    },
    testPathParams: {
      method: 'GET',
      path: '/test/:id/:name',
      pathParams: z.object({
        id: z
          .string()
          .transform(Number)
          .refine((v) => Number.isInteger(v), {
            message: 'Must be an integer',
          }),
      }),
      query: z.object({
        field: z.string().optional(),
      }),
      responses: {
        200: z.object({
          id: z.number().lt(1000),
          name: z.string(),
          defaultValue: z.string().default('hello world'),
        }),
      },
      metadata: { roles: ['guest', 'user'] } as const,
    },
  },
  {
    baseHeaders: z.object({
      'x-api-key': z.string(),
    }),
  },
);
