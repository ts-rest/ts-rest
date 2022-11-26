import { z } from 'zod';

export const isZodObject = (
  body: unknown
): body is z.ZodObject<any, any, any, any> => {
  return (body as z.ZodObject<any, any, any, any>)?.safeParse !== undefined;
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
      error: unknown;
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
