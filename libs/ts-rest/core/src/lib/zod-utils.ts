import { z, ZodTypeAny } from 'zod';

export const returnZodErrorsIfZodSchema = (
  schema: unknown,
  body: unknown
): z.ZodIssue[] => {
  const bodySchema = schema as ZodTypeAny;

  if (
    bodySchema &&
    bodySchema._def &&
    bodySchema._def.typeName === 'ZodObject'
  ) {
    // Check body schema
    const parsed = bodySchema.safeParse(body);

    if (parsed.success === false) {
      return parsed.error.issues;
    }
  }

  return [];
};
