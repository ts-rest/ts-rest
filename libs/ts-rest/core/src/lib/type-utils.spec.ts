/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { getValue, ZodInferOrType } from './type-utils';

const zodObject = z.object({ title: z.string() });
type Test1 = ZodInferOrType<typeof zodObject>;

const zodObjectNullable = zodObject.nullable();
type Test2 = ZodInferOrType<typeof zodObject>;

type Test3 = ZodInferOrType<{ title: string }>;

it.todo('should infer type');

describe('getValue', () => {
  it('should get one level deep', () => {
    const obj = {
      title: 'Title',
    };

    const value = getValue(obj, 'title');

    expect(value).toBe('Title');
  });

  it('should get one level deep with nullable', () => {
    const obj = {
      title: 'Title',
    };

    const value = getValue(obj, 'test', null);

    expect(value).toBe(null);
  });

  it('should get two levels deep', () => {
    const obj = {
      sub: {
        text: 'text',
      },
    };

    const value = getValue(obj, 'sub.text');

    expect(value).toBe('text');
  });
});
