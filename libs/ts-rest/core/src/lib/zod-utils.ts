import { z } from 'zod';

export const isZodObject = (body: unknown): body is z.AnyZodObject => {
  return (body as z.AnyZodObject)?.safeParse !== undefined;
};

export const zodMerge = (objectA: unknown, objectB: unknown) => {
  if (isZodObject(objectA)) {
    if (isZodObject(objectB)) {
      return objectA.merge(objectB);
    }

    return objectA;
  }

  if (isZodObject(objectB)) {
    return objectB;
  }

  return Object.assign({}, objectA, objectB);
};

export const checkZodSchema = (
  data: unknown,
  schema: unknown,
  { passThroughExtraKeys = false } = {}
):
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      error: z.ZodError;
    } => {
  if (isZodObject(schema)) {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data:
          passThroughExtraKeys && typeof data === 'object'
            ? { ...data, ...result.data }
            : result.data,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    data: data,
  };
};

// Convert a ZodError to a plain object because ZodError extends Error and causes problems with NestJS
export const zodErrorResponse = (
  error: z.ZodError
): Pick<z.ZodError, 'name' | 'issues'> => {
  return {
    name: error.name,
    issues: error.issues,
  };
};
