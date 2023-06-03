import { initContract } from '@ts-rest/core';
import { createExpressEndpoints, initServer } from './ts-rest-express';
import * as supertest from 'supertest';
import * as express from 'express';
import { z } from 'zod';

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
  it('should allow sending non json responses', async () => {
    const c = initContract();

    const contract = c.router({
      getPost: {
        method: 'GET',
        path: `/posts/:id`,
        query: z.object({
          responseExample: z.enum(['string', 'object', 'html', 'text/plain']),
        }),
        responses: {
          200: c.response<any>(),
        },
      },
    });

    const server = initServer();

    const router = server.router(contract, {
      getPost: async ({ params: { id }, query, res }) => {
        if (query.responseExample === 'object') {
          return {
            status: 200,
            body: {
              hello: 'world',
            },
          };
        }

        if (query.responseExample === 'html') {
          return {
            status: 200,
            body: '<h1>hello</h1>',
          };
        }

        if (query.responseExample === 'text/plain') {
          res.set('content-type', 'text/plain; charset=utf-8');

          return {
            status: 200,
            body: 'hello, but this time as text/plain',
          };
        }

        return {
          status: 200,
          body: 'hello',
        };
      },
    });

    const app = express();

    createExpressEndpoints(contract, router, app);

    const response = await supertest(app).get(
      '/posts/1?responseExample=string'
    );

    expect(response.status).toEqual(200);
    expect(response.text).toEqual('hello');
    expect(response.header['content-type']).toEqual('text/html; charset=utf-8');

    const responseObject = await supertest(app).get(
      '/posts/1?responseExample=object'
    );

    expect(responseObject.status).toEqual(200);
    expect(responseObject.body).toEqual({ hello: 'world' });
    expect(responseObject.header['content-type']).toEqual(
      'application/json; charset=utf-8'
    );

    const responseHtml = await supertest(app).get(
      '/posts/1?responseExample=html'
    );

    expect(responseHtml.status).toEqual(200);
    expect(responseHtml.text).toEqual('<h1>hello</h1>');
    expect(responseHtml.header['content-type']).toEqual(
      'text/html; charset=utf-8'
    );

    const responseTextPlain = await supertest(app).get(
      '/posts/1?responseExample=text/plain'
    );

    expect(responseTextPlain.status).toEqual(200);
    expect(responseTextPlain.text).toEqual(
      'hello, but this time as text/plain'
    );
    expect(responseTextPlain.header['content-type']).toEqual(
      'text/plain; charset=utf-8'
    );
  });
});
