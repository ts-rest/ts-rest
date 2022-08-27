import { z } from 'zod';
import { returnZodErrorsIfZodSchema } from './zod-utils';

describe('returnZodErrorsIfZodSchema', () => {
  it('should return an empty array if the body is valid', () => {
    const schema = z.object({
      foo: z.string(),
    });

    const body = {
      foo: 'bar',
    };

    const result = returnZodErrorsIfZodSchema(schema, body);

    expect(result).toEqual([]);
  });

  it('should return an array of errors if the body is invalid', () => {
    const schema = z.object({
      foo: z.string(),
    });

    const body = {
      foo: 1,
    };

    const result = returnZodErrorsIfZodSchema(schema, body);

    expect(result).toEqual([
      {
        code: 'invalid_type',
        expected: 'string',
        message: 'Expected string, received number',
        path: ['foo'],
        received: 'number',
      },
    ]);
  });
});
