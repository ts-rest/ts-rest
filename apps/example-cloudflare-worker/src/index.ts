import type {
  Request as WorkerRequest,
  ExecutionContext,
} from '@cloudflare/workers-types/2023-03-01';
import { fetchRequestHandler, tsr } from '@ts-rest/serverless/fetch';
import { apiBlog, Post } from '@ts-rest/example-contracts';

const mockPostFixtureFactory = (partial: Partial<Post>): Post => ({
  id: 'mock-id',
  title: `Post`,
  content: `Content`,
  description: `Description`,
  published: true,
  tags: ['tag1', 'tag2'],
  ...partial,
});

const router = tsr
  .platformContext<{
    workerRequest: WorkerRequest;
    workerContext: ExecutionContext;
  }>()
  .router(apiBlog, {
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
    updatePost: async ({ body }) => {
      const post = mockPostFixtureFactory(body);

      return {
        status: 200,
        body: post,
      };
    },
    deletePost: async ({ params: { id } }) => {
      return {
        status: 200,
        body: { message: `Post ${id} deleted` },
      };
    },
    testPathParams: async ({ params }) => {
      return {
        status: 200,
        body: {
          ...params,
          shouldDelete: 'foo',
        },
      };
    },
  });

export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return fetchRequestHandler({
      request,
      contract: apiBlog,
      router,
      options: {
        responseHandlers: [
          (response, request, { workerRequest }) => {
            response.headers.set(
              'x-geo-country',
              workerRequest.cf?.country as string,
            );
            return response;
          },
        ],
        responseValidation: true,
      },
      platformContext: {
        workerRequest: request as unknown as WorkerRequest,
        workerContext: ctx,
      },
    });
  },
};
