import { z } from 'zod';

export const isZodObject = (body: unknown): body is z.AnyZodObject => {
  return (body as z.AnyZodObject)?.safeParse !== undefined;
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
      error: Pick<z.ZodError, 'name' | 'issues'>;
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
      error: {
        name: result.error.name,
        issues: result.error.issues,
      },
    };
  }

  return {
    success: true,
    data: data,
  };
};
