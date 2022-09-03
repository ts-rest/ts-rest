import { z, ZodTypeAny } from 'zod';
import { AppRoute } from './dsl';

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

const isZodObject = (
  body: unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): body is z.ZodObject<any, any, any, any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (body as z.ZodObject<any, any, any, any>).safeParse !== undefined;
};

export const checkBodySchema = (
  body: unknown,
  appRoute: AppRoute
):
  | {
      success: true;
      body: unknown;
    }
  | {
      success: false;
      error: unknown;
    } => {
  if (appRoute.method !== 'GET' && appRoute.body) {
    if (isZodObject(appRoute.body)) {
      const result = appRoute.body.safeParse(body);

      if (result.success) {
        return {
          success: true,
          body: result.data,
        };
      }

      return {
        success: false,
        error: result.error,
      };
    }
  }

  return {
    success: true,
    body: body,
  };
};

export const checkQuerySchema = (
  query: unknown,
  appRoute: AppRoute
):
  | {
      success: true;
      body: unknown;
    }
  | {
      success: false;
      error: unknown;
    } => {
  if (appRoute.query) {
    if (isZodObject(appRoute.query)) {
      const result = appRoute.query.safeParse(query);

      if (result.success) {
        return {
          success: true,
          body: result.data,
        };
      }

      return {
        success: false,
        error: result.error,
      };
    }
  }

  return {
    success: true,
    body: query,
  };
};
