import { z } from 'zod';
import { getHeaderParameterSchema } from './headers';
import { ZOD_SYNC, ZOD_ASYNC } from './test-helpers';

describe('headers', () => {
  describe('zod', () => {
    it('sync - single required header', () => {
      const res = getHeaderParameterSchema.sync({
        transformSchema: ZOD_SYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          headers: z.object({
            'x-api-key': z.string(),
          }),
          responses: {
            200: z.object({}),
          },
        },
        id: 'testFunc',
        concatenatedPath: 'testFunc',
      });

      expect(res).toEqual([
        {
          name: 'x-api-key',
          in: 'header',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('sync - discriminatedUnion headers schema (issue #800)', () => {
      const res = getHeaderParameterSchema.sync({
        transformSchema: ZOD_SYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          headers: z.discriminatedUnion('x-type', [
            z.object({
              'x-type': z.literal('a'),
              'x-field-a': z.string(),
            }),
            z.object({
              'x-type': z.literal('b'),
              'x-field-b': z.string(),
            }),
          ]),
          responses: {
            200: z.object({}),
          },
        },
        id: 'testFunc',
        concatenatedPath: 'testFunc',
      });

      expect(res.map((param) => param.name).sort()).toEqual([
        'x-field-a',
        'x-field-b',
        'x-type',
      ]);
      expect(res).not.toEqual([]);
    });

    it('async - discriminatedUnion headers schema (issue #800)', async () => {
      const res = await getHeaderParameterSchema.async({
        transformSchema: ZOD_ASYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          headers: z.discriminatedUnion('x-type', [
            z.object({
              'x-type': z.literal('a'),
              'x-field-a': z.string(),
            }),
            z.object({
              'x-type': z.literal('b'),
              'x-field-b': z.string(),
            }),
          ]),
          responses: {
            200: z.object({}),
          },
        },
        id: 'testFunc',
        concatenatedPath: 'testFunc',
      });

      expect(res.map((param) => param.name).sort()).toEqual([
        'x-field-a',
        'x-field-b',
        'x-type',
      ]);
      expect(res).not.toEqual([]);
    });
  });
});
