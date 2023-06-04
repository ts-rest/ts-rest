import { initContract } from '@ts-rest/core';
import { initServer } from './ts-rest-fastify';
import { z } from 'zod';
import fastify from 'fastify';
import fastifyExpress from '@fastify/express';
import fastifyMiddie from '@fastify/middie';
import * as supertest from 'supertest';

const c = initContract();

const contract = c.router({
  test: {
    method: 'GET',
    path: '/test',
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
  ping: {
    method: 'POST',
    path: '/ping',
    body: z.object({
      ping: z.string(),
    }),
    responses: {
      200: z.object({
        pong: z.string(),
      }),
    },
  },
  testPathParams: {
    method: 'GET',
    path: '/test/:id',
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: z.object({
        id: z.string(),
      }),
    },
  },
  returnsTheWrongData: {
    method: 'GET',
    path: '/wrong',
    responses: {
      200: z.object({
        foo: z.string(),
      }),
    },
  },
});

jest.setTimeout(30000);

describe('ts-rest-fastify', () => {
  const s = initServer();

  const router = s.router(contract, {
    test: async () => {
      return {
        status: 200,
        body: {
          foo: 'bar',
        },
      };
    },
    ping: async ({ body }) => {
      return {
        status: 200,
        body: {
          pong: body.ping,
        },
      };
    },
    testPathParams: async ({ params }) => {
      return {
        status: 200,
        body: {
          id: params.id,
        },
      };
    },
    returnsTheWrongData: async () => {
      return {
        status: 200,
        body: {
          foo: 'bar',
          bar: 'foo', // this is extra
        },
      };
    },
  });

  it('should instantiate fastify routes', async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
    });

    await app.ready();

    const response = await supertest(app.server).get('/test');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar' });
  });

  it('should instantiate fastify routes using plugin instance', async () => {
    const app = fastify({ logger: false });

    app.register(s.plugin(router));

    await app.ready();

    const response = await supertest(app.server).get('/test');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar' });
  });

  it('should allow for options when using plugin instance', async () => {
    const app = fastify({ logger: false });

    app.register(s.plugin(router), {
      responseValidation: true,
    });

    await app.ready();

    const response = await supertest(app.server).get('/wrong');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar' });
  });

  it('should parse body correctly', async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
    });

    await app.ready();

    const response = await supertest(app.server)
      .post('/ping')
      .send({ ping: 'foo' });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ pong: 'foo' });
  });

  it("should throw error if body doesn't match", async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
    });

    await app.ready();

    const response = await supertest(app.server).post('/ping').send({});

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual({
      bodyErrors: {
        issues: [
          {
            code: 'invalid_type',
            expected: 'string',
            message: 'Required',
            path: ['ping'],
            received: 'undefined',
          },
        ],
        name: 'ZodError',
      },
      headerErrors: null,
      pathParameterErrors: null,
      queryParameterErrors: null,
    });
  });

  it("should allow for custom error handler if body doesn't match", async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
      requestValidationErrorHandler: (err, request, reply) => {
        return reply.status(500).send({
          numberOfBodyErrors: err.body?.issues.length,
        });
      },
    });

    await app.ready();

    const response = await supertest(app.server).post('/ping').send({});

    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual({
      numberOfBodyErrors: 1,
    });
  });

  it('should parse path params correctly', async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
    });

    await app.ready();

    const response = await supertest(app.server).get('/test/foo');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ id: 'foo' });
  });

  it('options.responseValidation true should remove extra properties', async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
      responseValidation: true,
    });

    await app.ready();

    const response = await supertest(app.server).get('/wrong');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar' });
  });

  it('options.responseValidation false should not remove extra properties', async () => {
    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app, {
      logInitialization: false,
      responseValidation: false,
    });

    await app.ready();

    const response = await supertest(app.server).get('/wrong');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar', bar: 'foo' });
  });

  it('prefixed contract should work with fastify', async () => {
    const postsContractNested = c.router(
      {
        getPost: {
          path: '/:postId',
          method: 'GET',
          responses: { 200: c.response<{ id: string }>() },
        },
      },
      { pathPrefix: '/posts' }
    );
    const postsContract = c.router(
      {
        posts: postsContractNested,
      },
      { pathPrefix: '/v1' }
    );
    const router = s.router(postsContract, {
      posts: {
        getPost: async ({ params }) => {
          return { status: 200, body: { id: params.postId } };
        },
      },
    });
    const app = fastify();
    s.registerRouter(postsContract, router, app);

    await app.ready();

    const response = await supertest(app.server).get('/v1/posts/10');

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ id: '10' });
  });

  it('should allow for middleware to be used with @fastify/middie', async () => {
    const app = fastify({ logger: false });
    app.register(fastifyMiddie);

    const contract = c.router({
      test: {
        method: 'GET',
        path: '/test',
        responses: {
          200: z.object({
            foo: z.string(),
          }),
        },
      },
      routeWithMiddleware: {
        method: 'GET',
        path: '/middleware',
        responses: {
          200: z.object({
            foo: z.string(),
          }),
        },
      },
    });

    const router = s.router(contract, {
      test: async () => {
        return {
          status: 200,
          body: {
            foo: 'bar',
          },
        };
      },
      routeWithMiddleware: {
        middleware: [
          async (request, response, next) => {
            expect(request.tsRestRoute.path).toEqual('/middleware');
            request.headers['x-foo'] = 'bar';
            next();
          },
          async (request, response, next) => {
            expect(request.headers['x-foo']).toEqual('bar');
            next();
          },
        ],
        handler: async () => {
          return {
            status: 200,
            body: {
              foo: 'bar',
            },
          };
        },
      },
    });

    app.register(s.plugin(router));

    await app.ready();

    const response = await supertest(app.server).get('/middleware').send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar' });
  });

  it('should allow for middleware to be used with @fastify/express', async () => {
    const app = fastify({ logger: false });
    app.register(fastifyExpress);

    const contract = c.router({
      test: {
        method: 'GET',
        path: '/test',
        responses: {
          200: z.object({
            foo: z.string(),
          }),
        },
      },
      routeWithMiddleware: {
        method: 'GET',
        path: '/middleware',
        responses: {
          200: z.object({
            foo: z.string(),
          }),
        },
      },
    });

    const router = s.router(contract, {
      test: async () => {
        return {
          status: 200,
          body: {
            foo: 'bar',
          },
        };
      },
      routeWithMiddleware: {
        middleware: [
          async (request, response, next) => {
            expect(request.tsRestRoute.path).toEqual('/middleware');
            request.headers['x-foo'] = 'bar';
            next();
          },
          async (request, response, next) => {
            expect(request.headers['x-foo']).toEqual('bar');
            next();
          },
        ],
        handler: async () => {
          return {
            status: 200,
            body: {
              foo: 'bar',
            },
          };
        },
      },
    });

    app.register(s.plugin(router));

    await app.ready();

    const response = await supertest(app.server).get('/middleware').send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ foo: 'bar' });
  });

  it('should allow for middleware to reject the request with @fastify/middie', async () => {
    const app = fastify({ logger: false });
    app.register(fastifyMiddie);

    const contract = c.router({
      routeWithMiddleware: {
        method: 'GET',
        path: '/middleware',
        responses: {
          200: z.object({
            foo: z.string(),
          }),
        },
      },
    });

    const router = s.router(contract, {
      routeWithMiddleware: {
        middleware: [
          async (request, response) => {
            return response.writeHead(401).end();
          },
        ],
        handler: async () => {
          return {
            status: 200,
            body: { foo: 'bar' },
          };
        },
      },
    });

    app.register(s.plugin(router));

    await app.ready();

    const response = await supertest(app.server).get('/middleware').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should allow for middleware to reject the request with @fastify/express', async () => {
    const app = fastify({ logger: false });
    app.register(fastifyExpress);

    const contract = c.router({
      routeWithMiddleware: {
        method: 'GET',
        path: '/middleware',
        responses: {
          200: z.object({
            foo: z.string(),
          }),
        },
      },
    });

    const router = s.router(contract, {
      routeWithMiddleware: {
        middleware: [
          async (request, response) => {
            return response.status(401).send();
          },
        ],
        handler: async () => {
          return {
            status: 200,
            body: { foo: 'bar' },
          };
        },
      },
    });

    app.register(s.plugin(router));

    await app.ready();

    const response = await supertest(app.server).get('/middleware').send();

    expect(response.statusCode).toEqual(401);
  });
});
