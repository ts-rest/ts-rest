import { z } from 'zod';

export const isZodType = (obj: unknown): obj is z.ZodTypeAny => {
  return typeof (obj as z.ZodTypeAny)?.safeParse === 'function';
};

export const isZodObject = (
  obj: unknown
): obj is z.AnyZodObject | z.ZodEffects<z.AnyZodObject> => {
  const isZodEffects =
    typeof (obj as z.ZodEffects<z.AnyZodObject>)?.innerType === 'function';

  const maybeZodObject = isZodEffects
    ? (obj as z.ZodEffects<z.AnyZodObject>)?.innerType()
    : (obj as z.AnyZodObject);

  return typeof (maybeZodObject as z.AnyZodObject)?.passthrough === 'function';
};

export const extractZodObjectShape = <
  T extends z.AnyZodObject | z.ZodEffects<z.AnyZodObject>
>(
  obj: T
) => {
  if (!isZodObject(obj)) {
    throw new Error('Unknown zod object type');
  }

  if ('innerType' in obj) {
    return obj.innerType().shape;
  }

  return obj.shape;
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
