import { initContract } from '@ts-rest/core';
import {
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
  NestResponseShapes,
} from './ts-rest-nest';
import { TsRest } from './ts-rest.decorator';
import { TsRestRequest } from './ts-rest-request.decorator';
import { Controller, INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';

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

it('allows unknown statuses when not in strict mode', () => {
  const cLoose = c.router({ posts: postsRouter });
  const nestContract = nestControllerContract(cLoose.posts);
  type RequestShapes = NestRequestShapes<typeof nestContract>;
  type ResponseShapes = NestResponseShapes<typeof nestContract>;

  const responseTypeCheck: Awaited<ResponseShapes['getPost']> = {
    status: 419,
    body: 'invalid status and response',
  };
  class PostController implements NestControllerInterface<typeof nestContract> {
    @TsRest(nestContract.getPost)
    async getPost(
      @TsRestRequest() { params: { id } }: RequestShapes['getPost']
    ) {
      return { status: 201 as const, body: null };
    }
  }
});

it('does not allow unknown statuses when in strict mode', () => {
  const cStrict = c.router({ posts: postsRouter }, { strictStatusCodes: true });
  const nestContract = nestControllerContract(cStrict.posts);
  type contractType = typeof nestContract;
  type RequestShapes = NestRequestShapes<contractType>;
  type ResponseShapes = NestResponseShapes<typeof nestContract>;

  const responseTypeCheck: Awaited<ResponseShapes['getPost']> = {
    // @ts-expect-error 419 is not defined as a known response
    status: 419,
    // @ts-expect-error 419 is not defined as a known response
    body: 'invalid status and response',
  };

  class PostController implements NestControllerInterface<typeof nestContract> {
    @TsRest(nestContract.getPost)
    // @ts-expect-error 201 is not defined as a known response
    async getPost(
      @TsRestRequest() { params: { id } }: RequestShapes['getPost']
    ) {
      return { status: 201 as const, body: null };
    }
  }
});

it('allows responseShapes types to be used in controller logic', () => {
  const cStrict = c.router({ posts: postsRouter }, { strictStatusCodes: true });
  const nestContract = nestControllerContract(cStrict.posts);
  type contractType = typeof nestContract;
  type RequestShapes = NestRequestShapes<contractType>;
  type ResponseShapes = NestResponseShapes<typeof nestContract>;

  class PostController implements NestControllerInterface<typeof nestContract> {
    @TsRest(nestContract.getPost)
    async getPost(
      @TsRestRequest() { params: { id } }: RequestShapes['getPost']
    ) {
      const result: ResponseShapes['getPost'] = {
        status: 200 as const,
        body: null,
      };
      return result;
    }
  }
});

describe('ts-rest-nest', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  const initializeApp = async (controller: Type) => {
    const moduleRef = await Test.createTestingModule({
      controllers: [controller],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    return app.getHttpServer();
  };

  it('should handle non-json response types from contract', async () => {
    const c = initContract();
    const nonJsonContract = c.router({
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

    @Controller()
    class NonJsonController
      implements NestControllerInterface<typeof nonJsonContract>
    {
      @TsRest(nonJsonContract.getIndex)
      async getIndex(@TsRestRequest() _: any) {
        return {
          status: 200,
          body: '<h1>hello world</h1>',
        } as const;
      }

      @TsRest(nonJsonContract.getRobots)
      async getRobots(@TsRestRequest() _: any) {
        return {
          status: 200,
          body: 'User-agent: * Disallow: /',
        } as const;
      }

      @TsRest(nonJsonContract.getCss)
      async getCss(@TsRestRequest() _: any) {
        return {
          status: 200,
          body: 'body { color: red; }',
        } as const;
      }
    }

    const server = await initializeApp(NonJsonController);

    const responseHtml = await supertest(server).get('/index.html');
    expect(responseHtml.status).toEqual(200);
    expect(responseHtml.text).toEqual('<h1>hello world</h1>');
    expect(responseHtml.header['content-type']).toEqual(
      'text/html; charset=utf-8'
    );

    const responseTextPlain = await supertest(server).get('/robots.txt');
    expect(responseTextPlain.status).toEqual(200);
    expect(responseTextPlain.text).toEqual('User-agent: * Disallow: /');
    expect(responseTextPlain.header['content-type']).toEqual(
      'text/plain; charset=utf-8'
    );

    const responseCss = await supertest(server).get('/style.css');
    expect(responseCss.status).toEqual(200);
    expect(responseCss.text).toEqual('body { color: red; }');
    expect(responseCss.header['content-type']).toEqual(
      'text/css; charset=utf-8'
    );
  });
});
