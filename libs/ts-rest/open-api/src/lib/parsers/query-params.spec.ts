import { z } from 'zod';
import { getQueryParameterSchema } from './query-params';
import { ZOD_SYNC, ZOD_ASYNC, VALIBOT_ASYNC } from './test-helpers';
import * as v from 'valibot';

describe('query-params', () => {
  describe('zod', () => {
    it('sync - single required param ', async () => {
      const res = getQueryParameterSchema.sync({
        transformSchema: ZOD_SYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          query: z.object({
            name: z.string(),
          }),
          responses: {
            200: z.object({
              name: z.string(),
            }),
          },
        },
        id: 'testFunc',
      });

      expect(res).toEqual([
        {
          name: 'name',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('sync - single optional param', async () => {
      const res = getQueryParameterSchema.sync({
        transformSchema: ZOD_SYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          query: z.object({
            name: z.string().optional(),
          }),
          responses: {
            200: z.object({
              name: z.string(),
            }),
          },
        },
        id: 'testFunc',
      });

      expect(res).toEqual([
        {
          name: 'name',
          in: 'query',
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('async - single required param ', async () => {
      const res = await getQueryParameterSchema.async({
        transformSchema: ZOD_ASYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          query: z.object({
            name: z.string(),
          }),
          responses: {
            200: z.object({
              name: z.string(),
            }),
          },
        },
        id: 'testFunc',
      });

      expect(res).toEqual([
        {
          name: 'name',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('async - single optional param', async () => {
      const result = await getQueryParameterSchema.async({
        transformSchema: ZOD_ASYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          query: z.object({
            name: z.string().optional(),
          }),
          responses: {
            200: z.object({
              name: z.string(),
            }),
          },
        },
        id: 'testFunc',
      });

      expect(result).toEqual([
        {
          name: 'name',
          in: 'query',
          schema: {
            type: 'string',
          },
        },
      ]);
    });
  });

  describe('valibot', () => {
    it('async - single required param', async () => {
      const res = await getQueryParameterSchema.async({
        transformSchema: VALIBOT_ASYNC,
        appRoute: {
          method: 'GET',
          path: '/',
          query: v.object({
            name: v.string(),
          }),
          responses: {
            200: v.object({
              name: v.string(),
            }),
          },
        },
        id: 'testFunc',
      });

      expect(res).toEqual([
        {
          name: 'name',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });
  });
});
