/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { ZodInferOrType } from './type-utils';

const zodObject = z.object({ title: z.string() });
type Test1 = ZodInferOrType<typeof zodObject>;

const zodObjectNullable = zodObject.nullable();
type Test2 = ZodInferOrType<typeof zodObject>;

type Test3 = ZodInferOrType<{ title: string }>;
