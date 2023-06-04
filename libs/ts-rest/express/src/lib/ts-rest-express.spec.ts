import { initContract } from '@ts-rest/core';
import { createExpressEndpoints, initServer } from './ts-rest-express';
import * as supertest from 'supertest';
import * as express from 'express';

const c = initContract();
const postsRouter = c.router({
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: null,
    },
  },
});

describe('strict mode', () => {
  it('allows unknown responses when not in strict mode', () => {
    const cLoose = c.router({ posts: postsRouter });
    const s = initServer();

    s.router(cLoose, {
      posts: {
        getPost: async ({ params: { id } }) => {
          return {
            status: 201,
            body: null,
          };
        },
      },
    });
  });

  it('does not allow unknown statuses when in strict mode', () => {
    const cStrict = c.router(
      { posts: postsRouter },
      { strictStatusCodes: true }
    );
    const s = initServer();

    s.router(cStrict, {
      posts: {
        // @ts-expect-error 201 is not defined as a known response
        getPost: async ({ params: { id } }) => {
          return {
            status: 201,
            body: null,
          };
        },
      },
    });
  });
});

describe('ts-rest-express', () => {
  it('should handle non-json response types from contract', async () => {
    const c = initContract();

    const contract = c.router({
      getIndex: {
        method: 'GET',
        path: `/index.html`,
        responses: {
          200: c.htmlResponse(),
        },
      },
      getRobots: {
        method: 'GET',
        path: `/robots.txt`,
        responses: {
          200: c.textResponse(),
        },
      },
      getCss: {
        method: 'GET',
        path: '/style.css',
        responses: {
          200: c.nonJsonResponse<string>('text/css'),
        },
      },
    });

    const server = initServer();

    const router = server.router(contract, {
      getIndex: async () => {
        return {
          status: 200,
          body: '<h1>hello world</h1>',
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

    const app = express();

    createExpressEndpoints(contract, router, app);

    const responseHtml = await supertest(app).get('/index.html');
    expect(responseHtml.status).toEqual(200);
    expect(responseHtml.text).toEqual('<h1>hello world</h1>');
    expect(responseHtml.header['content-type']).toEqual(
      'text/html; charset=utf-8'
    );

    const responseTextPlain = await supertest(app).get('/robots.txt');
    expect(responseTextPlain.status).toEqual(200);
    expect(responseTextPlain.text).toEqual('User-agent: * Disallow: /');
    expect(responseTextPlain.header['content-type']).toEqual(
      'text/plain; charset=utf-8'
    );

    const responseCss = await supertest(app).get('/style.css');
    expect(responseCss.status).toEqual(200);
    expect(responseCss.text).toEqual('body { color: red; }');
    expect(responseCss.header['content-type']).toEqual(
      'text/css; charset=utf-8'
    );
  });
});
