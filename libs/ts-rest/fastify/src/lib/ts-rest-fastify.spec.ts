import { initContract } from '@ts-rest/core';
import { initServer } from './ts-rest-fastify';
import { z } from 'zod';
import fastify from 'fastify';
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
    ping: s.route(contract.ping, async ({ body }) => {
      return {
        status: 200,
        body: {
          pong: body.ping,
        },
      };
    }),
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

  it('should remove extra properties from request body', async () => {
    const contract = c.router({
      echo: {
        method: 'POST',
        path: '/echo',
        body: z.object({
          foo: z.string(),
        }),
        responses: {
          200: z.any(),
        },
      },
    });

    const router = s.router(contract, {
      echo: async ({ body }) => {
        return {
          status: 200,
          body: body,
        };
      },
    });

    const app = fastify({ logger: false });

    s.registerRouter(contract, router, app);

    await app.ready();

    const response = await supertest(app.server).post('/echo').send({
      foo: 'bar',
      bar: 'foo',
    });
    expect(response.body).toEqual({ foo: 'bar' });
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
          responses: { 200: c.type<{ id: string }>() },
        },
      },
      { pathPrefix: '/posts' },
    );
    const postsContract = c.router(
      {
        posts: postsContractNested,
      },
      { pathPrefix: '/v1' },
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

  it('should handle non-json response types from contract', async () => {
    const c = initContract();

    const nonJsonContract = c.router({
      postIndex: {
        method: 'POST',
        path: `/index.html`,
        body: z.object({
          echoHtml: z.string(),
        }),
        responses: {
          200: c.otherResponse({
            contentType: 'text/html',
            body: z.string().regex(/^<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>$/im),
          }),
        },
      },
      getRobots: {
        method: 'GET',
        path: `/robots.txt`,
        responses: {
          200: c.otherResponse({
            contentType: 'text/plain',
            body: c.type<string>(),
          }),
        },
      },
      getCss: {
        method: 'GET',
        path: '/style.css',
        responses: {
          200: c.otherResponse({
            contentType: 'text/css',
            body: c.type<string>(),
          }),
        },
      },
    });

    const nonJsonRouter = s.router(nonJsonContract, {
      postIndex: async ({ body: { echoHtml } }) => {
        return {
          status: 200,
          body: echoHtml,
        };
      },
      getRobots: async () => {
        return {
          status: 200,
          body: 'User-agent: * Disallow: /',
        };
      },
      getCss: async () => {
        return {
          status: 200,
          body: 'body { color: red; }',
        };
      },
    });

    const app = fastify({ logger: false });

    s.registerRouter(nonJsonContract, nonJsonRouter, app, {
      logInitialization: false,
      responseValidation: true,
    });

    app.setErrorHandler((err, request, reply) => {
      reply.status(500).send('Response validation failed');
    });

    await app.ready();

    const responseHtml = await supertest(app.server).post('/index.html').send({
      echoHtml: '<h1>hello world</h1>',
    });
    expect(responseHtml.status).toEqual(200);
    expect(responseHtml.text).toEqual('<h1>hello world</h1>');
    expect(responseHtml.header['content-type']).toEqual('text/html');

    const responseHtmlFail = await supertest(app.server)
      .post('/index.html')
      .send({
        echoHtml: 'hello world',
      });
    expect(responseHtmlFail.status).toEqual(500);
    expect(responseHtmlFail.text).toEqual('Response validation failed');
    expect(responseHtmlFail.header['content-type']).toEqual(
      'text/plain; charset=utf-8',
    );

    const responseTextPlain = await supertest(app.server).get('/robots.txt');
    expect(responseTextPlain.status).toEqual(200);
    expect(responseTextPlain.text).toEqual('User-agent: * Disallow: /');
    expect(responseTextPlain.header['content-type']).toEqual('text/plain');

    const responseCss = await supertest(app.server).get('/style.css');
    expect(responseCss.status).toEqual(200);
    expect(responseCss.text).toEqual('body { color: red; }');
    expect(responseCss.header['content-type']).toEqual('text/css');
  });

  it('should return errors from route handlers', async () => {
    const erroringRouter = s.router(contract, {
      test: async () => {
        throw new Error('not implemented');
      },
      ping: async () => {
        throw new Error('not implemented');
      },
      testPathParams: async () => {
        throw new Error('not implemented');
      },
      returnsTheWrongData: async () => {
        throw new Error('not implemented');
      },
    });

    const app = fastify({ logger: false });

    s.registerRouter(contract, erroringRouter, app);

    await app.ready();

    const response = await supertest(app.server)
      .get('/test')
      .timeout(1000)
      .send({});
    expect(response.statusCode).toEqual(500);
  });

  it('should be able to instantiate two routers and combine them together', async () => {
    const contractA = c.router({
      a: {
        method: 'GET',
        path: '/a',
        responses: {
          200: z.object({
            a: z.string(),
          }),
        },
      },
    });

    const contractB = c.router({
      b: {
        method: 'GET',
        path: '/b',
        responses: {
          200: z.object({
            b: z.string(),
          }),
        },
      },
    });

    const combinedContract = c.router({
      apiA: contractA,
      apiB: contractB,
    });

    const routerA = s.router(contractA, {
      a: async () => {
        return {
          status: 200,
          body: {
            a: 'return',
          },
        };
      },
    });

    const routerB = s.router(contractB, {
      b: async () => {
        return {
          status: 200,
          body: {
            b: 'return',
          },
        };
      },
    });

    const combinedRouter = s.router(combinedContract, {
      apiA: routerA,
      apiB: routerB,
    });

    const app = fastify({ logger: false });

    app.register(s.plugin(combinedRouter));

    await app.ready();

    const responseA = await supertest(app.server).get('/a');
    expect(responseA.statusCode).toEqual(200);
    expect(responseA.body).toEqual({
      a: 'return',
    });

    const responseB = await supertest(app.server).get('/b');
    expect(responseB.statusCode).toEqual(200);
    expect(responseB.body).toEqual({
      b: 'return',
    });
  });

  it('should be able to mix and match combining routers with direct implementation', async () => {
    const contract = c.router({
      apiA: {
        a: {
          method: 'GET',
          path: '/a',
          responses: {
            200: z.object({
              a: z.string(),
            }),
          },
        },
      },
      apiB: {
        b: {
          method: 'GET',
          path: '/b',
          responses: {
            200: z.object({
              b: z.string(),
            }),
          },
        },
      },
    });

    const routerForApiA = s.router(contract.apiA, {
      a: async () => {
        return {
          status: 200,
          body: {
            a: 'return',
          },
        };
      },
    });

    const router = s.router(contract, {
      apiA: routerForApiA,
      apiB: {
        b: async () => {
          return {
            status: 200,
            body: {
              b: 'return',
            },
          };
        },
      },
    });

    const app = fastify({ logger: false });

    app.register(s.plugin(router));

    await app.ready();

    const responseA = await supertest(app.server).get('/a');
    expect(responseA.statusCode).toEqual(200);
    expect(responseA.body).toEqual({
      a: 'return',
    });

    const responseB = await supertest(app.server).get('/b');
    expect(responseB.statusCode).toEqual(200);
    expect(responseB.body).toEqual({
      b: 'return',
    });
  });
});
