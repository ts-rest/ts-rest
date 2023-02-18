import { FastifyInstance } from 'fastify';
import { createFastifyEndpoints, fastifyController } from '@ts-rest/fastify';
import { apiBlog, Post } from '@ts-rest/example-contracts';
import { generateOpenApi } from '@ts-rest/open-api';

const mockPostFactory = (partial: Partial<Post>): Post => ({
  id: '1',
  title: 'title',
  description: 'description',
  content: 'content',
  published: true,
  tags: ['tag1', 'tag2'],
  ...partial,
});

const controller = fastifyController(apiBlog, {
  createPost: async ({ body }) => {
    const post = mockPostFactory({ ...body });

    return {
      status: 201,
      body: post,
    };
  },
  updatePost: async ({ params, body }) => {
    const post = mockPostFactory({ ...body, id: params.id });

    return {
      status: 200,
      body: post,
    };
  },
  deletePost: async ({ params }) => {
    return {
      status: 200,
      body: { message: `Post ${params.id} deleted` },
    };
  },
  getPost: async ({ params }) => {
    const post = mockPostFactory({ id: params.id });

    return {
      status: 200,
      body: post,
    };
  },
  getPosts: async ({ query: { skip, take } }) => {
    const posts = [mockPostFactory({ id: '1' }), mockPostFactory({ id: '2' })];

    return {
      status: 200,
      body: {
        posts,
        count: posts.length,
        skip: skip,
        take: take,
      },
    };
  },
  testPathParams: async ({ params }) => {
    return {
      status: 200,
      body: params,
    };
  },
});

export async function app(fastify: FastifyInstance) {
  createFastifyEndpoints(apiBlog, controller, fastify, {});

  const openApi = generateOpenApi(apiBlog, {
    info: {
      title: 'Example API',
      version: '1.0.0',
    },
  });

  fastify.get('/openapi.json', (req, res) => {
    res.send(openApi);
  });
}
