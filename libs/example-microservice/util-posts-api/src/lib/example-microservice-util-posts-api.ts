import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string().nullable(),
  published: z.boolean(),
  tags: z.array(z.string()),
  author: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});

export type Post = z.infer<typeof PostSchema>;

const c = initContract();

export const postsApi = c.router(
  {
    getPosts: {
      method: 'GET',
      path: '/posts',
      query: z.object({
        userId: z.number().optional(),
      }),
      responses: {
        200: z.array(PostSchema),
        400: z.object({
          message: z.string(),
        }),
      },
      description: 'Get all posts',
    },

    updatePostThumbnail: {
      method: 'POST',
      path: '/posts/:id/thumbnail',
      contentType: 'multipart/form-data',
      body: c.body<{ thumbnail: File; data: string }>(),
      responses: {
        200: z.object({
          message: z.string(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      description: 'Update post thumbnail',
    },
  },
  { urlPrefix: 'test' }
);
