import { createNextHandler } from '@ts-rest/serverless/next';
import { apiBlog } from '@ts-rest-examples/contracts';
import type { Post } from '@ts-rest-examples/contracts';

export const config = {
  runtime: 'edge',
};

export const mockPostFixtureFactory = (partial: Partial<Post>): Post => ({
  id: 'mock-id',
  title: 'Post',
  content: 'Content',
  description: 'Description',
  published: true,
  ...partial,
});

export default createNextHandler(
  apiBlog,
  {
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
  },
  {
    basePath: '/api/edge',
    jsonQuery: true,
    responseValidation: true,
    handlerType: 'pages-router-edge',
  }
);
