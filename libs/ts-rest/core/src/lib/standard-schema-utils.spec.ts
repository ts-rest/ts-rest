import { StandardSchemaV1 } from './standard-schema';
import {
  checkStandardSchema,
  isStandardSchema,
  isZod3,
  mergeStandardSchema,
} from './standard-schema-utils';
import { z } from 'zod';
import * as v from 'valibot';

describe('standard schema utils', () => {
  describe('checkStandardSchema', () => {
    it('zod 3', () => {
      const value = { foo: 'bar' };
      const schema = z.object({ foo: z.string() });
      const result = checkStandardSchema(value, schema);

      expect(result.value).toEqual({ foo: 'bar' });
    });

    it('valibot', () => {
      const value = { foo: 'bar' };
      const schema = v.object({ foo: v.string() });
      const result = checkStandardSchema(value, schema);

      expect(result.value).toEqual({ foo: 'bar' });
    });
  });

  describe('isZod3', () => {
    it('should return true if the schema is zod 3', () => {
      const schema = z.object({ foo: z.string() });
      expect(isZod3(schema)).toBe(true);
    });

    it('should return false if valibot', () => {
      const schema = v.object({ foo: v.string() });
      expect(isZod3(schema)).toBe(false);
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
      [z.object({ foo: z.string() }), true],
      [v.object({ foo: v.string() }), true],
      [diyStandardSchema, true],
      [null, false],
      [undefined, false],
      [1, false],
      [true, false],
      ['foo', false],
      [false, false],
    ])('should return %s for %s', (schema, expected) => {
      expect(isStandardSchema(schema)).toBe(expected);
    });
  });

  describe('mergeStandardSchema', () => {
    it('should merge two strict schemas', () => {
      const baseHeaders = z.object({ foo: z.string() }).strict();
      const routeHeaders = z.object({ bar: z.string() }).strict();
      const headers = mergeStandardSchema(
        baseHeaders,
        routeHeaders,
      ) as StandardSchemaV1;

      expect(
        headers['~standard'].validate({ foo: 'foo', bar: 'bar', baz: 'baz' }),
      ).toEqual({
        issues: [
          {
            code: 'unrecognized_keys',
            keys: ['baz'],
            message: "Unrecognized key(s) in object: 'baz'",
            path: [],
          },
        ],
      });
    });

    it('should merge a strict and non-strict schema', () => {
      const baseHeaders = z.object({ foo: z.string() }).strict();
      const routeHeaders = z.object({ bar: z.string() });
      const headers = mergeStandardSchema(
        baseHeaders,
        routeHeaders,
      ) as StandardSchemaV1;

      expect(
        headers['~standard'].validate({ foo: 'foo', bar: 'bar', baz: 'baz' }),
      ).toEqual({
        value: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });

    it('should merge a non-strict and strict schema', () => {
      const baseHeaders = z.object({ foo: z.string() });
      const routeHeaders = z.object({ bar: z.string() }).strict();
      const headers = mergeStandardSchema(
        baseHeaders,
        routeHeaders,
      ) as StandardSchemaV1;

      expect(
        headers['~standard'].validate({ foo: 'foo', bar: 'bar', baz: 'baz' }),
      ).toEqual({
        issues: [
          {
            code: 'unrecognized_keys',
            keys: ['baz'],
            message: "Unrecognized key(s) in object: 'baz'",
            path: [],
          },
        ],
      });
    });

    it('should merge a non-strict and non-strict schema', () => {
      const baseHeaders = z.object({ foo: z.string() });
      const routeHeaders = z.object({ bar: z.string() });
      const headers = mergeStandardSchema(
        baseHeaders,
        routeHeaders,
      ) as StandardSchemaV1;

      expect(
        headers['~standard'].validate({ foo: 'foo', bar: 'bar', baz: 'baz' }),
      ).toEqual({
        value: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });
  });
});
