import { describe, it, expect } from 'bun:test';
import { app } from './index';
import request from 'supertest';
import {
  RequestValidationErrorSchema,
  RequestValidationErrorSchemaForNest,
  RequestValidationErrorSchemaWithoutMessage,
} from '@ts-rest/core';

const expectRes = (res: any) => {
  return expect({ body: res.body, status: res.status });
};

describe('zod 3', () => {
  /**
   * This is only supported for zod3, other libs going forward will not support this
   */
  it('should still support RequestValidationErrorSchema', () => {
    expect(RequestValidationErrorSchema).toBeDefined();

    const parseResult = RequestValidationErrorSchema.safeParse({
      message: 'Request validation failed',
      pathParameterErrors: null,
      headerErrors: null,
      queryParameterErrors: null,
      bodyErrors: null,
    });

    expect(parseResult.success).toBe(true);
  });

  /**
   * This is only supported for zod3, other libs going forward will not support this
   */
  it('should still support RequestValidationErrorSchemaWithoutMessage', () => {
    expect(RequestValidationErrorSchemaWithoutMessage).toBeDefined();

    const parseResult = RequestValidationErrorSchemaWithoutMessage.safeParse({
      pathParameterErrors: null,
      headerErrors: null,
      queryParameterErrors: null,
      bodyErrors: null,
    });

    expect(parseResult.success).toBe(true);
  });

  /**
   * This is only supported for zod3, other libs going forward will not support this
   */
  it('should still support RequestValidationErrorSchemaForNest', () => {
    expect(RequestValidationErrorSchemaForNest).toBeDefined();

    const parseResult = RequestValidationErrorSchemaForNest.safeParse({
      paramsResult: null,
      headersResult: null,
      queryResult: null,
      bodyResult: null,
    });

    expect(parseResult.success).toBe(true);
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
            message: 'Expected number, received nan',
            path: ['id'],
            received: 'nan',
          },
        ],
        name: 'ZodError',
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
