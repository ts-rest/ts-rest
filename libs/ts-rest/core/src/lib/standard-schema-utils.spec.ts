import { StandardSchemaV1 } from './standard-schema';
import {
  combineStandardSchemas,
  isStandardSchema,
  parseAsStandardSchema,
  validateAgainstStandardSchema,
} from './standard-schema-utils';
import { ZodError, z } from 'zod';
import * as v from 'valibot';

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

  describe('mergeStandardSchema', () => {
    it('should merge two strict schemas', () => {
      const baseHeaders = z.object({ foo: z.string() }).strict();
      const routeHeaders = z.object({ bar: z.string() }).strict();

      const baseHeadersSchema = parseAsStandardSchema(baseHeaders)!;
      const routeHeadersSchema = parseAsStandardSchema(routeHeaders)!;

      const combinedSchema = combineStandardSchemas(
        baseHeadersSchema,
        routeHeadersSchema,
      );

      const result = validateAgainstStandardSchema(
        { foo: 'foo', bar: 'bar', baz: 'baz' },
        combinedSchema,
      );

      expect(result).toStrictEqual({
        error: new ZodError([
          {
            code: 'unrecognized_keys',
            keys: ['baz'],
            path: [],
            message: "Unrecognized key(s) in object: 'baz'",
          },
        ]),
      });
    });

    it('should merge a strict and non-strict schema', () => {
      const baseHeaders = z.object({ foo: z.string() }).strict();
      const routeHeaders = z.object({ bar: z.string() });
      const baseHeadersSchema = parseAsStandardSchema(baseHeaders)!;
      const routeHeadersSchema = parseAsStandardSchema(routeHeaders)!;

      const headers = combineStandardSchemas(
        baseHeadersSchema,
        routeHeadersSchema,
      );

      const result = validateAgainstStandardSchema(
        { foo: 'foo', bar: 'bar', baz: 'baz' },
        headers,
      );

      expect(result).toEqual({
        value: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });

    it('should merge a non-strict and strict schema', () => {
      const baseHeaders = z.object({ foo: z.string() });
      const routeHeaders = z.object({ bar: z.string() }).strict();
      const baseHeadersSchema = parseAsStandardSchema(baseHeaders)!;
      const routeHeadersSchema = parseAsStandardSchema(routeHeaders)!;

      const headers = combineStandardSchemas(
        baseHeadersSchema,
        routeHeadersSchema,
      );

      const result = validateAgainstStandardSchema(
        { foo: 'foo', bar: 'bar', baz: 'baz' },
        headers,
      );

      expect(result).toEqual({
        error: new ZodError([
          {
            code: 'unrecognized_keys',
            keys: ['baz'],
            path: [],
            message: "Unrecognized key(s) in object: 'baz'",
          },
        ]),
      });
    });

    it('should merge a non-strict and non-strict schema', () => {
      const baseHeaders = z.object({ foo: z.string() });
      const routeHeaders = z.object({ bar: z.string() });
      const baseHeadersSchema = parseAsStandardSchema(baseHeaders)!;
      const routeHeadersSchema = parseAsStandardSchema(routeHeaders)!;

      const headers = combineStandardSchemas(
        baseHeadersSchema,
        routeHeadersSchema,
      );

      const result = validateAgainstStandardSchema(
        { foo: 'foo', bar: 'bar', baz: 'baz' },
        headers,
      );

      expect(result).toEqual({
        value: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });

    it('should fail to merge a zod legacy schema and a standard schema', () => {
      const zodSchema = z.object({ zod: z.string() });
      const valibotSchema = v.object({ valibot: v.string() });

      const zodSchemaStandard = parseAsStandardSchema(zodSchema)!;
      const valibotSchemaStandard = parseAsStandardSchema(valibotSchema)!;

      expect(() =>
        combineStandardSchemas(zodSchemaStandard, valibotSchemaStandard),
      ).toThrow(
        'Cannot combine a zod < 3.24.0 schema with a standard schema, please use zod >= 3.24.0 or any other standard schema library',
      );
    });

    it('should merge two valibot schemas', () => {
      const valibotSchema1 = v.object({ foo: v.string() });
      const valibotSchema2 = v.object({ bar: v.string() });

      const valibotSchema1Standard = parseAsStandardSchema(valibotSchema1)!;
      const valibotSchema2Standard = parseAsStandardSchema(valibotSchema2)!;

      const combinedSchema = combineStandardSchemas(
        valibotSchema1Standard,
        valibotSchema2Standard,
      );

      const result = validateAgainstStandardSchema(
        { foo: 'foo', bar: 'bar', extraKey: true },
        combinedSchema,
      );

      expect(result).toEqual({
        value: { foo: 'foo', bar: 'bar' },
      });
    });

    it('should merge two valibot schemas (pass through extra keys)', () => {
      const valibotSchema1 = v.object({ foo: v.string() });
      const valibotSchema2 = v.object({ bar: v.string() });

      const valibotSchema1Standard = parseAsStandardSchema(valibotSchema1)!;
      const valibotSchema2Standard = parseAsStandardSchema(valibotSchema2)!;

      const combinedSchema = combineStandardSchemas(
        valibotSchema1Standard,
        valibotSchema2Standard,
      );

      const result = validateAgainstStandardSchema(
        { foo: 'foo', bar: 'bar', extraKey: true },
        combinedSchema,
        { passThroughExtraKeys: true },
      );

      expect(result).toEqual({
        value: { foo: 'foo', bar: 'bar', extraKey: true },
      });
    });
  });
});
