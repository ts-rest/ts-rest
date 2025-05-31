import { z } from 'zod';
import { ZOD_SYNC, ZOD_ASYNC, VALIBOT_ASYNC } from './test-helpers';
import * as v from 'valibot';
import { getParamsFromPathOnly, getPathParameterSchema } from './path-params';
import { ParameterObject } from 'openapi3-ts';
import { ContractAnyType } from '@ts-rest/core';

/**
 * Theres a few permutations to deal with, mainly sync and async, so we build up CASES then run them against both
 */
const CASES: {
  type: 'zod' | 'valibot';
  name: string;
  path: string;
  pathParams: unknown;
  expected: ParameterObject[];
  only?: true;
}[] = [
  {
    type: 'zod',
    name: 'no params, no schema',
    path: '/',
    pathParams: undefined,
    expected: [],
  },
  {
    type: 'zod',
    name: 'single param, no schema',
    path: '/:id',
    pathParams: undefined,
    expected: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  },
  {
    type: 'zod',
    name: 'multiple params, no schema',
    pathParams: undefined,
    path: '/:id/:name',
    expected: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'name',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  },
  {
    type: 'zod',
    name: 'single param, zod schema',
    path: '/:id',
    pathParams: z.object({
      id: z.string().describe('The id of the post'),
    }),
    expected: [
      {
        name: 'id',
        description: 'The id of the post',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  },
  {
    type: 'zod',
    name: 'multiple params, zod schema',
    path: '/:id/:name',
    pathParams: z.object({
      id: z.string(),
      name: z.string(),
    }),
    expected: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'name',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  },
  {
    type: 'zod',
    name: 'multiple params, partial zod schema',
    path: '/:id/:name/:extra',
    pathParams: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      // extra is not in the schema
    }),
    expected: [
      {
        name: 'id',
        in: 'path',
        schema: {
          type: 'string',
        },
      },
      {
        name: 'name',
        in: 'path',
        schema: {
          type: 'string',
        },
      },
      {
        name: 'extra',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  },
  {
    type: 'zod',
    name: 'single param, zod schema, optional',
    path: '/:id',
    pathParams: z.object({
      id: z.string().optional(),
    }),
    expected: [
      {
        name: 'id',
        in: 'path',
        schema: {
          type: 'string',
        },
      },
    ],
  },
  /**
   * Valibot tests
   */
  {
    type: 'valibot',
    name: 'single param, valibot schema',
    path: '/:id',
    pathParams: v.object({
      id: v.string(),
    }),
    expected: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
  },
  {
    type: 'valibot',
    name: 'single param, valibot schema, optional',
    path: '/:id',
    pathParams: v.object({
      id: v.optional(v.string()),
    }),
    expected: [
      {
        name: 'id',
        in: 'path',
        schema: {
          type: 'string',
        },
      },
    ],
  },
];

const hasOnly = CASES.some((c) => c.only);
const CASES_TO_RUN = hasOnly ? CASES.filter((c) => c.only) : CASES;

describe('path-params', () => {
  it.each(CASES_TO_RUN)(
    'sync - $name ($type)',
    ({ type, name, path, pathParams, expected }) => {
      // No valibot sync possible so return
      if (type === 'valibot') {
        return;
      }
      const res = getPathParameterSchema.sync({
        transformSchema: ZOD_SYNC,
        appRoute: {
          method: 'GET',
          path,
          pathParams: pathParams as ContractAnyType | undefined,
          responses: {
            200: z.object({
              name: z.string(),
            }),
          },
        },
        id: 'testFunc',
        concatenatedPath: 'testFunc',
      });

      expect(res).toEqual(expected);
    },
  );

  it.each(CASES_TO_RUN)(
    'async - $name ($type)',
    async ({ type, name, path, pathParams, expected }) => {
      const res = await getPathParameterSchema.async({
        transformSchema: type === 'zod' ? ZOD_ASYNC : VALIBOT_ASYNC,
        appRoute: {
          method: 'GET',
          path,
          pathParams: pathParams as ContractAnyType | undefined,
          responses: {
            200: z.object({
              name: z.string(),
            }),
          },
        },
        id: 'testFunc',
        concatenatedPath: 'testFunc',
      });

      expect(res).toEqual(expected);
    },
  );
});

describe('getParamsFromPathOnly', () => {
  it('should return the correct params', () => {
    const params = getParamsFromPathOnly('/posts/:id/comments/:commentId');
    const paramsArray = Array.from(params.values());

    expect(paramsArray).toEqual([
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
      {
        name: 'commentId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ]);
  });
});
