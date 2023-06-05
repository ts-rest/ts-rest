import { initContract } from '@ts-rest/core';
import {
  doesUrlMatchContractPath,
  tsRestHandler,
  TsRestHandler,
} from './ts-rest-nest-handler';
import { z } from 'zod';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as supertest from 'supertest';

describe('doesUrlMatchContractPath', () => {
  it.each`
    contractPath    | url           | expected
    ${'/'}          | ${'/'}        | ${true}
    ${'/'}          | ${'/api'}     | ${false}
    ${'/api'}       | ${'/api'}     | ${true}
    ${'/posts/:id'} | ${'/posts/1'} | ${true}
    ${'/posts/:id'} | ${'/posts/1'} | ${true}
    ${'/posts/:id'} | ${'/posts'}   | ${false}
  `(
    'should return $expected when contractPath is $contractPath and url is $url',
    ({ contractPath, url, expected }) => {
      expect(doesUrlMatchContractPath(contractPath, url)).toBe(expected);
    }
  );
});

describe('ts-rest-nest-handler', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  describe('multi-handler api', () => {
    it('should be able to implement a whole contract', async () => {
      const c = initContract();

      const contract = c.router({
        getRequest: {
          path: '/test',
          method: 'GET',
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
        postRequest: {
          path: '/test',
          method: 'POST',
          body: z.object({
            message: z.string(),
          }),
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      });

      @Controller()
      class TestController {
        @TsRestHandler(contract)
        async handler() {
          return tsRestHandler(contract, {
            getRequest: async () => ({
              status: 200,
              body: { message: 'hello' },
            }),
            postRequest: async ({ body }) => ({
              status: 200,
              body: { message: body.message },
            }),
          });
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      const responseGet = await supertest(app.getHttpServer())
        .get('/test')
        .send();

      expect(responseGet.status).toBe(200);
      expect(responseGet.body).toEqual({ message: 'hello' });

      const responsePost = await supertest(app.getHttpServer())
        .post('/test')
        .send({ message: 'hello' });

      expect(responsePost.status).toBe(200);
      expect(responsePost.body).toEqual({ message: 'hello' });
    });

    it('should validate body', async () => {
      const c = initContract();

      const contract = c.router({
        postRequest: {
          path: '/test',
          method: 'POST',
          body: z.object({
            message: z.string(),
          }),
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      });

      @Controller()
      class SingleHandlerTestController {
        @TsRestHandler(contract)
        async postRequest() {
          return tsRestHandler(contract, {
            postRequest: async ({ body }) => ({
              status: 200,
              body: body,
            }),
          });
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [SingleHandlerTestController],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      const response = await supertest(app.getHttpServer())
        .post('/test')
        .send({ message: 'hello' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'hello' });

      const responsePost = await supertest(app.getHttpServer())
        .post('/test')
        .send({ message: 123 });

      expect(responsePost.status).toBe(400);
      expect(responsePost.body).toEqual({
        bodyResult: {
          issues: [
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['message'],
              message: 'Expected string, received number',
            },
          ],
          name: 'ZodError',
        },
        headersResult: null,
        queryResult: null,
        paramsResult: null,
      });
    });
  });

  describe('single-handler api', () => {
    it('should be able to implement a single `AppRoute`', async () => {
      const c = initContract();

      const contract = c.router({
        getRequest: {
          path: '/test',
          method: 'GET',
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
        postRequest: {
          path: '/test',
          method: 'POST',
          body: z.object({
            message: z.string(),
          }),
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      });

      @Controller()
      class SingleHandlerTestController {
        @TsRestHandler(contract.getRequest)
        async getRequest() {
          return tsRestHandler(contract.getRequest, async () => ({
            status: 200,
            body: { message: 'hello' },
          }));
        }

        @TsRestHandler(contract.postRequest)
        async postRequest() {
          return tsRestHandler(contract.postRequest, async () => ({
            status: 200,
            body: { message: 'hello' },
          }));
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [SingleHandlerTestController],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      const response = await supertest(app.getHttpServer()).get('/test').send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'hello' });

      const responsePost = await supertest(app.getHttpServer())
        .post('/test')
        .send({ message: 'hello' });

      expect(responsePost.status).toBe(200);
      expect(responsePost.body).toEqual({ message: 'hello' });
    });

    it('should validate body', async () => {
      const c = initContract();

      const contract = c.router({
        postRequest: {
          path: '/test',
          method: 'POST',
          body: z.object({
            message: z.string(),
          }),
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      });

      @Controller()
      class SingleHandlerTestController {
        @TsRestHandler(contract.postRequest)
        async postRequest() {
          return tsRestHandler(contract.postRequest, async ({ body }) => ({
            status: 200,
            body: body,
          }));
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [SingleHandlerTestController],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      const response = await supertest(app.getHttpServer())
        .post('/test')
        .send({ message: 'hello' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'hello' });

      const responsePost = await supertest(app.getHttpServer())
        .post('/test')
        .send({ message: 123 });

      expect(responsePost.status).toBe(400);
      expect(responsePost.body).toEqual({
        bodyResult: {
          issues: [
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['message'],
              message: 'Expected string, received number',
            },
          ],
          name: 'ZodError',
        },
        headersResult: null,
        queryResult: null,
        paramsResult: null,
      });
    });

    it('should be able to enable response validation on the `TsRestHandler` decorator', async () => {
      const c = initContract();

      const contract = c.router({
        test: {
          path: '/test',
          method: 'GET',
          responses: {
            200: z.object({
              message: z.string(),
            }),
          },
        },
      });

      @Controller()
      class SingleHandlerTestController {
        @TsRestHandler(contract.test, {
          validateResponses: true,
        })
        async postRequest() {
          return tsRestHandler(contract.test, async () => ({
            status: 200,
            // Bad response as we lied to TS :(
            body: { message: 123123 as unknown as string },
          }));
        }
      }

      const moduleRef = await Test.createTestingModule({
        controllers: [SingleHandlerTestController],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();

      const response = await supertest(app.getHttpServer()).get('/test').send();

      expect(response.status).toBe(500);
    });
  });

  it('should be able to combine single-handler, multi-handler and vanilla nest controllers', async () => {
    const c = initContract();

    const contract = c.router({
      getRequest: {
        path: '/test',
        method: 'GET',
        responses: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
      postRequest: {
        path: '/test',
        method: 'POST',
        body: z.object({
          message: z.string(),
        }),
        responses: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    });

    @Controller()
    class MultiTypeHandlerController {
      @TsRestHandler(contract.postRequest)
      async handler2() {
        return tsRestHandler(contract.postRequest, async ({ body }) => ({
          status: 200,
          body: { message: body.message },
        }));
      }

      @Get('/basic-nest-endpoint')
      async basicNestEndpoint() {
        return { message: 'hello' };
      }

      @TsRestHandler({ getRequest: contract.getRequest })
      async handler() {
        return tsRestHandler(
          { getRequest: contract.getRequest },
          {
            getRequest: async () => ({
              status: 200,
              body: { message: 'hello' },
            }),
          }
        );
      }
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [MultiTypeHandlerController],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();

    const response = await supertest(app.getHttpServer()).get('/test').send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'hello' });

    const responsePost = await supertest(app.getHttpServer())
      .post('/test')
      .send({ message: 'hello' });

    expect(responsePost.status).toBe(200);
    expect(responsePost.body).toEqual({ message: 'hello' });

    const responseBasicNestEndpoint = await supertest(app.getHttpServer())
      .get('/basic-nest-endpoint')
      .send();

    expect(responseBasicNestEndpoint.status).toBe(200);
    expect(responseBasicNestEndpoint.body).toEqual({ message: 'hello' });
  });
});
