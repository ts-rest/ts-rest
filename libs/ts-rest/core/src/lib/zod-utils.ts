import { z } from 'zod';

// TODO: move to @ts-rest/open-api in next major version
/** @deprecated */
export const isZodType = (obj: unknown): obj is z.ZodTypeAny => {
  return typeof (obj as z.ZodTypeAny)?.safeParse === 'function';
};

// TODO: move to @ts-rest/open-api in next major version
/** @deprecated */
export const isZodObject = (
  obj: unknown,
): obj is z.AnyZodObject | z.ZodEffects<z.AnyZodObject> => {
  if (typeof (obj as z.AnyZodObject)?.passthrough === 'function') {
    return true;
  }

  if (typeof (obj as z.ZodEffects<z.ZodTypeAny>)?.innerType === 'function') {
    return isZodObject((obj as z.ZodEffects<z.ZodTypeAny>)?.innerType());
  }

  return false;
};

// TODO: remove in next major version
/** @deprecated */
export const isZodObjectStrict = (obj: unknown): obj is z.AnyZodObject => {
  return typeof (obj as z.AnyZodObject)?.passthrough === 'function';
};

// TODO: remove in next major version
/** @deprecated */
export const extractZodObjectShape = <
  T extends z.AnyZodObject | z.ZodEffects<z.ZodTypeAny>,
>(
  obj: T,
): any => {
  if (!isZodObject(obj)) {
    throw new Error('Unknown zod object type');
  }

  if ('innerType' in obj) {
    return extractZodObjectShape(obj.innerType());
  }

  return obj.shape;
};

// TODO: remove in next major version
/** @deprecated use mergeStandardSchema */
export const zodMerge = (objectA: unknown, objectB: unknown) => {
  if (isZodObjectStrict(objectA)) {
    if (isZodObjectStrict(objectB)) {
      return objectA.merge(objectB);
    }

    return objectA;
  }

  if (isZodObjectStrict(objectB)) {
    return objectB;
  }

  return Object.assign({}, objectA, objectB);
};

// TODO: remove in next major version
/** @deprecated use checkStandardSchema */
export const checkZodSchema = (
  data: unknown,
  schema: unknown,
  { passThroughExtraKeys = false } = {},
):
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      error: z.ZodError;
    } => {
  if (isZodType(schema)) {
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
// TODO: remove in next major version
/** @deprecated use validationErrorResponse */
export const zodErrorResponse = (
  error: z.ZodError,
): Pick<z.ZodError, 'name' | 'issues'> => {
  return {
    name: error.name,
    issues: error.issues,
  };
};

// TODO: remove in next major version
/** @deprecated use ValidationErrorSchema */
export const ZodErrorSchema = z.object({
  name: z.literal('ZodError'),
  issues: z.array(
    z
      .object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string().optional(),
        code: z.nativeEnum(z.ZodIssueCode),
      })
      // ZodIssuse type are complex and potentially unstable. So we don’t deal with his specific fields other than the common.
      .catchall(z.any()),
  ),
});
