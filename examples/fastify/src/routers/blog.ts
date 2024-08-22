import { apiBlog } from '@ts-rest-examples/contracts';
import { initServer } from '@ts-rest/fastify';
import { mockPost } from '../lib/mock-post';
import { getPost } from '../routes/get-post';

const s = initServer();

const router = s.router(apiBlog, {
  getPost,
  getPosts: async ({ query }) => {
    const posts = [
      mockPost({ id: '1' }),
      mockPost({ id: '2' }), // updated
    ];

    return {
      status: 200,
      body: {
        posts,
        count: 0,
        skip: query.skip,
        take: query.take,
      },
    };
  },
  createPost: async ({ body }) => {
    const post = mockPost(body); // updated

    return {
      status: 201,
      body: post,
    };
  },
  updatePost: async ({ body }) => {
    const post = mockPost(body); // updated

    return {
      status: 200,
      body: post,
    };
  },
  deletePost: async () => {
    return {
      status: 200,
      body: { message: 'Post deleted' },
    };
  },
  testPathParams: async ({ params }) => {
    return {
      status: 200,
      body: params,
    };
  },
});

export const blogPlugin = s.plugin(router);
