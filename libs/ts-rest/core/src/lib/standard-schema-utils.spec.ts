import { StandardSchemaV1 } from './standard-schema';
import {
  areAllSchemasLegacyZod,
  isStandardSchema,
  parseAsStandardSchema,
  validateAgainstStandardSchema,
  validateMultiSchemaObject,
  validateIfSchema,
} from './standard-schema-utils';
import { ZodError, z } from 'zod';
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
        input: z.object({ foo: z.string() }),
        expected: false, // zod <3.24.0 is not a standard schema
        description: 'zod 3',
      },
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

    it('should throw an error if the schema is invalid', () => {
      const data = { foo: 'bar' };
      const schema = z.object({ foo: z.number() });

      const result = validateIfSchema(data, schema);

      expect(result).toStrictEqual({
        error: new ZodError([
          {
            code: 'invalid_type',
            expected: 'number',
            received: 'string',
            path: ['foo'],
            message: 'Expected number, received string',
          },
        ]),
        schemasUsed: [schema],
      });
    });
  });

  describe('areAllSchemasLegacyZod', () => {
    it('should return true if all schemas are legacy zod', () => {
      const zodSchema = z.object({ foo: z.string() });

      const zodSchemaStandard = parseAsStandardSchema(zodSchema)!;

      expect(areAllSchemasLegacyZod([zodSchemaStandard])).toBe(true);
    });

    it('should return false if any schema is not a legacy zod', () => {
      const zodSchema = z.object({ foo: z.string() });
      const valibotSchema = v.object({ foo: v.string() });

      const zodSchemaStandard = parseAsStandardSchema(zodSchema)!;
      const valibotSchemaStandard = parseAsStandardSchema(valibotSchema)!;

      expect(
        areAllSchemasLegacyZod([zodSchemaStandard, valibotSchemaStandard]),
      ).toBe(false);
    });
  });

  describe('validateMultiSchemaObject', () => {
    it('should work for a legacy zod object', () => {
      const headers = {
        'x-foo': 'bar',
        'x-bar': 'baz',
      };

      const headersSchema = z.object({
        'x-foo': z.string(),
      });

      const result = validateMultiSchemaObject(headers, headersSchema);

      expect(result).toEqual({
        value: {
          'x-foo': 'bar',
          'x-bar': 'baz',
        },
        schemasUsed: [headersSchema],
      });
    });

    it('should error for missing headers', () => {
      const headers = {
        'x-foo': 'bar',
      };

      const headersSchema = z.object({
        'x-foo': z.string(),
        'x-bar': z.string(),
      });

      const result = validateMultiSchemaObject(headers, headersSchema);

      expect(result).toEqual({
        error: new ZodError([
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            path: ['x-bar'],
            message: 'Required',
          },
        ]),
        schemasUsed: [headersSchema],
      });
    });

    it('should not error for a missing schema', () => {
      const headers = {
        'x-foo': 'bar',
      };

      const result = validateMultiSchemaObject(headers, null);

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

    it('should error if mixing zod legacy and valibot', () => {
      expect(() =>
        validateMultiSchemaObject(
          { 'x-foo': 'bar', 'x-bar': 1 },
          { 'x-foo': v.string(), 'x-bar': z.string() },
        ),
      ).toThrow(
        'Cannot mix zod legacy and standard schema libraries, please use zod >= 3.24.0 or any other standard schema library',
      );
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
