/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { Equal, Expect } from './test-helpers';
import { AreAllPropertiesOptional, ZodInferOrType } from './type-utils';

const zodObject = z.object({ title: z.string() });
type Test1 = ZodInferOrType<typeof zodObject>;

const zodObjectNullable = zodObject.nullable();
type Test2 = ZodInferOrType<typeof zodObject>;

type Test3 = ZodInferOrType<{ title: string }>;

it.todo('should infer type');

type AreAllPropertiesOptional1 = Expect<
  Equal<AreAllPropertiesOptional<{ a: string; b?: string }>, false>
>;

type AreAllPropertiesOptional2 = Expect<
  Equal<AreAllPropertiesOptional<{ a?: string; b?: string }>, true>
>;

type AreAllPropertiesOptional3 = Expect<
  Equal<
    AreAllPropertiesOptional<{
      params: {
        id: string;
      };
      headers?: Record<string, string> | undefined;
    }>,
    false
  >
>;
