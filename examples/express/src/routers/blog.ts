import { apiBlog } from '@ts-rest-examples/contracts';
import { initServer } from '@ts-rest/express';
import { mockPostFixtureFactory } from '../lib/fixtures';
import { getPost } from '../routes/get-post';

const s = initServer();

export const blogRouter = s.router(apiBlog, {
  getPost,
  getPosts: async ({ query }) => {
    const posts = [
      mockPostFixtureFactory({ id: '1' }),
      mockPostFixtureFactory({ id: '2' }),
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
    const post = mockPostFixtureFactory(body);

    return {
      status: 201,
      body: post,
    };
  },
  updatePost: async ({ body, params: { id } }) => {
    const post = mockPostFixtureFactory({ id, ...body });

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
