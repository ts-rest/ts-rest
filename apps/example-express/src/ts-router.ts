import { initServer } from '@ts-rest/express';
import { contractTs } from '@ts-rest/example-contracts';
import { mockPostFixtureFactory } from './fixtures';

const s = initServer();

export const tsRouter = s.router(contractTs, {
  createPost: async ({ body }) => {
    const newPost = mockPostFixtureFactory(body);

    return {
      status: 201,
      body: newPost,
    };
  },
  getPost: async ({ params: { id } }) => {
    const post = mockPostFixtureFactory({ id });

    if (!post) {
      return {
        status: 404,
        body: null,
      };
    }

    return {
      status: 200,
      body: post,
    };
  },
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
        skip: query.skip || 0,
        take: query.take || 50,
      },
    };
  },
});
