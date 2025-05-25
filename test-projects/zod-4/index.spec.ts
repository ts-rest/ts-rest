import { describe, it, expect } from 'bun:test';
import { app, openApiSchema } from './index';
import request from 'supertest';

const expectRes = (res: any) => {
  return expect({ body: res.body, status: res.status });
};

describe('zod 4', () => {
  describe('open api', () => {
    it('should generate open api schema', () => {
      expect(openApiSchema).toBeDefined();

      expect(
        openApiSchema.paths['/pokemon/{id}'].get.responses['200'].content,
      ).toStrictEqual({
        'application/json': {
          // TOOD: Zod4 OpenAPI is not supported yet, the result is empty as the downstream library doesnt support it yet.
          schema: {},
        },
      });
    });
  });

  it('should be able to get', async () => {
    const res = await request(app).get('/pokemon/1');

    expectRes(res).toStrictEqual({
      status: 200,
      body: {
        id: 1,
        name: 'Charizard',
      },
    });
  });

  it('should do param validation', async () => {
    const res = await request(app).get('/pokemon/foo');

    expectRes(res).toStrictEqual({
      status: 400,
      body: {
        issues: [
          {
            code: 'invalid_type',
            expected: 'number',
            message: 'Invalid input: expected number, received NaN',
            path: ['id'],
            received: 'NaN',
          },
        ],
        name: 'ValidationError',
      },
    });
  });

  it('delete with no body and no return body', async () => {
    const res = await request(app).delete('/pokemon/1');

    expectRes(res).toStrictEqual({
      status: 200,
      body: {},
    });
  });

  it('update', async () => {
    const res = await request(app)
      .patch('/pokemon/1')
      .send({ name: 'pikachu' });

    expectRes(res).toStrictEqual({
      status: 200,
      body: {
        message: 'updated 1 to pikachu',
      },
    });
  });
});
