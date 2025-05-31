import { zodMerge } from './zod-utils';
import { z } from 'zod';

describe('zodMerge', () => {
  it('should merge two strict schemas', () => {
    const baseHeaders = z.object({ foo: z.string() }).strict();
    const routeHeaders = z.object({ bar: z.string() }).strict();
    const headers = zodMerge(baseHeaders, routeHeaders) as z.ZodSchema;

    expect(() =>
      headers.parse({ foo: 'foo', bar: 'bar', baz: 'baz' }),
    ).toThrowError('baz');
  });

  it('should merge a strict and non-strict schema', () => {
    const baseHeaders = z.object({ foo: z.string() }).strict();
    const routeHeaders = z.object({ bar: z.string() });
    const headers = zodMerge(baseHeaders, routeHeaders) as z.ZodSchema;

    expect(headers.parse({ foo: 'foo', bar: 'bar', baz: 'baz' })).toEqual({
      foo: 'foo',
      bar: 'bar',
    });
  });

  it('should merge a non-strict and strict schema', () => {
    const baseHeaders = z.object({ foo: z.string() });
    const routeHeaders = z.object({ bar: z.string() }).strict();
    const headers = zodMerge(baseHeaders, routeHeaders) as z.ZodSchema;

    expect(() =>
      headers.parse({ foo: 'foo', bar: 'bar', baz: 'baz' }),
    ).toThrowError('baz');
  });

  it('should merge a non-strict and non-strict schema', () => {
    const baseHeaders = z.object({ foo: z.string() });
    const routeHeaders = z.object({ bar: z.string() });
    const headers = zodMerge(baseHeaders, routeHeaders) as z.ZodSchema;

    expect(headers.parse({ foo: 'foo', bar: 'bar', baz: 'baz' })).toEqual({
      foo: 'foo',
      bar: 'bar',
    });
  });
});
