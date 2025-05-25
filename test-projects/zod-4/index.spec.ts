import { describe, it, expect } from 'bun:test';
import { app, contract } from './index';
import {
  generateOpenApiAsync,
  type SchemaTransformerAsync,
} from '@ts-rest/open-api';
import request from 'supertest';
import { isZodObject, isZodType } from '@ts-rest/core';
import { z } from 'zod/v4';
import { convert } from '@openapi-contrib/json-schema-to-openapi-schema';

const expectRes = (res: any) => {
  return expect({ body: res.body, status: res.status });
};

const SCHEMA_TRANSFORMER: SchemaTransformerAsync = async (schema: unknown) => {
  if (isZodObject(schema)) {
    const jsonSchema = z.toJSONSchema(schema as any);

    return await convert(jsonSchema);
  }

  return null;
};

describe('zod 4', () => {
  describe('open api', () => {
    it('should generate open api schema', async () => {
      const openApiSchema = await generateOpenApiAsync(
        contract,
        {
          info: {
            title: 'Pokemon API',
            version: '1.0.0',
          },
        },
        {
          schemaTransformer: SCHEMA_TRANSFORMER,
        },
      );

      expect(openApiSchema).toBeDefined();

      expect(
        openApiSchema.paths['/pokemon/{id}'].get.responses['200'].content,
      ).toStrictEqual({
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
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
