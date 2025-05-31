import { SchemaObject } from 'openapi3-ts';
import { schemaObjectToParameters } from './utils';
import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';

describe('utils', () => {
  describe('schemaObjectToParameters', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };

    const parameters = schemaObjectToParameters(schema, 'query');

    it('should return an array of parameters', () => {
      expect(parameters).toEqual([
        {
          name: 'name',
          in: 'query',
          required: true,
          schema: { type: 'string' },
        },
      ]);
    });

    it('should return an empty array if the schema is not an object', () => {
      const schema: SchemaObject = { type: 'string' };
      const parameters = schemaObjectToParameters(schema, 'query');
      expect(parameters).toEqual([]);
    });

    it('should return optional parameters if the schema is not required', async () => {
      const schema = generateSchema(
        z.object({
          name: z.string().optional(),
        }),
      );

      const parameters = schemaObjectToParameters(schema, 'query');
      expect(parameters).toEqual([
        {
          name: 'name',
          in: 'query',
          schema: { type: 'string' },
        },
      ]);
    });

    it("should inlude `style: 'deepObject'` if the schema is a deep object", () => {
      const schema = generateSchema(
        z.object({
          parent: z.object({
            child: z.string(),
          }),
        }),
      );

      const parameters = schemaObjectToParameters(schema, 'query');

      expect(parameters).toEqual([
        {
          name: 'parent',
          in: 'query',
          required: true,
          schema: {
            properties: {
              child: { type: 'string' },
            },
            required: ['child'],
            type: 'object',
          },
          style: 'deepObject',
        },
      ]);
    });

    it('should work for jsonQuery', () => {
      const schema = generateSchema(
        z.object({
          name: z.string(),
        }),
      );

      const parameters = schemaObjectToParameters(schema, 'query', true);
      expect(parameters).toEqual([
        {
          name: 'name',
          in: 'query',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      ]);
    });
  });
});
