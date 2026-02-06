import { StandardSchemaV1 } from './standard-schema';
import {
  isStandardSchema,
  parseAsStandardSchema,
  validateAgainstStandardSchema,
  validateMultiSchemaObject,
  validateIfSchema,
} from './standard-schema-utils';
import { z } from 'zod';
import * as v from 'valibot';
import { StandardSchemaError } from './validation-error';
import { initContract } from './dsl';

const c = initContract();

describe('standard schema utils', () => {
  describe('validateAgainstStandardSchema', () => {
    it('zod 3', () => {
      const value = { foo: 'bar' };

      const schema = parseAsStandardSchema(z.object({ foo: z.string() }))!;
      const result = validateAgainstStandardSchema(value, schema);

      expect(result).toEqual({ value: { foo: 'bar' } });
    });

    it('valibot', () => {
      const value = { foo: 'bar' };
      const schema = parseAsStandardSchema(v.object({ foo: v.string() }))!;
      const result = validateAgainstStandardSchema(value, schema);

      expect(result).toEqual({ value: { foo: 'bar' } });
    });
  });

  describe('isStandardSchema', () => {
    const diyStandardSchema = {
      '~standard': {
        version: 1,
        vendor: 'ts-rest-test',
        validate: () => ({ value: {} }),
      },
    };
    it.each([
      {
        input: v.object({ foo: v.string() }),
        expected: true,
        description: 'valibot',
      },
      {
        input: diyStandardSchema,
        expected: true,
        description: 'diy standard schema',
      },
      { input: null, expected: false, description: 'null' },
      { input: undefined, expected: false, description: 'undefined' },
      { input: 1, expected: false, description: '1' },
      { input: true, expected: false, description: 'true' },
      { input: 'foo', expected: false, description: 'foo' },
      { input: false, expected: false, description: 'false' },
    ])('should return $expected for $description', ({ input, expected }) => {
      expect(isStandardSchema(input)).toBe(expected);
    });
  });

  describe('validateIfSchema', () => {
    it('should validate the data if a schema is provided', () => {
      const data = { foo: 'bar' };
      const schema = z.object({ foo: z.string() });

      const result = validateIfSchema(data, schema);

      expect(result).toEqual({
        value: { foo: 'bar' },
        schemasUsed: [schema],
      });
    });

    it('should pass through the data if no schema is provided', () => {
      const data = { foo: 'bar' };

      const result = validateIfSchema(data, null);

      expect(result).toEqual({ value: { foo: 'bar' }, schemasUsed: [] });
    });
  });

  describe('validateMultiSchemaObject', () => {
    it('should error for missing headers', () => {
      const headers = {
        'x-foo': 'bar',
      };

      const headersSchema = {
        'x-foo': z.string(),
        'x-bar': z.string(),
      };

      const result = validateMultiSchemaObject(headers, headersSchema);

      expect(result).toStrictEqual({
        error: new StandardSchemaError([
          {
            expected: 'string',
            code: 'invalid_type',
            path: ['x-bar'],
            message: 'Invalid input: expected string, received undefined',
          } as StandardSchemaV1.Issue,
        ]),
        schemasUsed: [headersSchema['x-foo'], headersSchema['x-bar']],
      });
    });

    it('should not error for a missing schema', () => {
      const headers = {
        'x-foo': 'bar',
      };

      const result = validateMultiSchemaObject(headers, undefined);

      expect(result).toEqual({
        value: {
          'x-foo': 'bar',
        },
        schemasUsed: [],
      });
    });

    it('should work for a valibot object', () => {
      const headers = {
        'x-foo': 'bar',
        'x-bar': 'baz',
      };

      const headersSchema = {
        'x-foo': v.string(),
        'x-bar': v.string(),
      };

      const result = validateMultiSchemaObject(headers, headersSchema);

      expect(result).toEqual({
        value: {
          'x-foo': 'bar',
          'x-bar': 'baz',
        },
        schemasUsed: [headersSchema['x-foo'], headersSchema['x-bar']],
      });
    });

    it('should error if missing a required header', () => {
      const schema = { 'x-foo': v.string() };
      const result = validateMultiSchemaObject({}, schema);

      expect(result).toEqual({
        error: new StandardSchemaError([
          {
            kind: 'schema',
            type: 'string',
            expected: 'string',
            received: 'undefined',
            message: 'Invalid type: Expected string but received undefined',
            path: ['x-foo'],
          } as StandardSchemaV1.Issue,
        ]),
        schemasUsed: [schema['x-foo']],
      });
    });

    it('should error if the header is the wrong type', () => {
      const schema = v.string();
      const result = validateMultiSchemaObject(
        { 'x-foo': 1 },
        { 'x-foo': schema },
      );

      expect(result).toEqual({
        error: new StandardSchemaError([
          {
            kind: 'schema',
            type: 'string',
            input: 1,
            expected: 'string',
            received: '1',
            message: 'Invalid type: Expected string but received 1',
            path: ['x-foo'],
          } as StandardSchemaV1.Issue,
        ]),
        schemasUsed: [schema],
      });
    });

    it('should gracefully deal with null, and with other helpers like c.type()', () => {
      const headers = {
        'x-foo': 'bar',
        'x-bar': 1,
        'x-baz': 1,
      };

      const headersSchema = {
        'x-foo': c.type<string>(),
        'x-bar': null,
        'x-baz': c.type<null>(),
      };

      const result = validateMultiSchemaObject(headers, headersSchema);

      expect(result).toEqual({
        value: {
          'x-foo': 'bar',
          'x-bar': 1,
          'x-baz': 1,
        },
        schemasUsed: [],
      });
    });
  });
});
