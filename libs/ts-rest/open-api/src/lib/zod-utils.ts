import { generateSchema } from '@anatine/zod-openapi';
import { z } from 'zod';

const isZodType = (obj: unknown): obj is z.ZodTypeAny => {
  return typeof (obj as z.ZodTypeAny)?.safeParse === 'function';
};

const isZodObject = (
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

const extractZodObjectShape = <
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

export const getOpenApiSchemaFromZod = (
  zodType: unknown,
  useOutput = false,
) => {
  if (!isZodType(zodType)) {
    return null;
  }

  return generateSchema(zodType, useOutput);
};

export const getPathParametersFromZod = (path: string, zodObject?: unknown) => {
  const isZodObj = isZodObject(zodObject);
  const zodShape = isZodObj ? extractZodObjectShape(zodObject) : {};

  const paramsFromPath = path
    .match(/{[^}]+}/g)
    ?.map((param) => param.slice(1, -1))
    .filter((param) => {
      return zodShape[param] === undefined;
    });

  const params: any[] =
    paramsFromPath?.map((param) => ({
      name: param,
      in: 'path' as const,
      required: true,
      schema: {
        type: 'string',
      },
    })) || [];

  if (isZodObj) {
    const paramsFromZod = Object.entries(zodShape).map(([key, value]) => {
      const { description, ...schema } = getOpenApiSchemaFromZod(value)!;
      return {
        name: key,
        in: 'path' as const,
        required: true,
        schema,
        ...(description && { description }),
      };
    });

    params.push(...paramsFromZod);
  }

  return params;
};

export const getHeaderParametersFromZod = (zodObject?: unknown) => {
  const isZodObj = isZodObject(zodObject);

  if (!isZodObj) {
    return [];
  }

  const zodShape = extractZodObjectShape(zodObject);

  return Object.entries(zodShape).map(([key, value]) => {
    const schema = getOpenApiSchemaFromZod(value)!;
    const isRequired = !(value as z.ZodTypeAny).isOptional();

    return {
      name: key,
      in: 'header' as const,
      ...(isRequired && { required: true }),
      ...{
        schema: schema,
      },
    };
  });
};

export const getQueryParametersFromZod = (
  zodObject: unknown,
  jsonQuery = false,
) => {
  const isZodObj = isZodObject(zodObject);

  if (!isZodObj) {
    return [];
  }

  const zodShape = extractZodObjectShape(zodObject);

  return Object.entries(zodShape).map(([key, value]) => {
    const {
      description,
      mediaExamples: examples,
      ...schema
    } = getOpenApiSchemaFromZod(value)!;
    const isObject = (obj: z.ZodTypeAny) => {
      while (obj._def.innerType) {
        obj = obj._def.innerType;
      }

      return obj._def.typeName === 'ZodObject';
    };
    const isRequired = !(value as z.ZodTypeAny).isOptional();

    return {
      name: key,
      in: 'query' as const,
      ...(description && { description }),
      ...(isRequired && { required: true }),
      ...(jsonQuery
        ? {
            content: {
              'application/json': {
                schema: schema,
                ...(examples && { examples }),
              },
            },
          }
        : {
            ...(isObject(value as z.ZodTypeAny) && {
              style: 'deepObject' as const,
            }),
            schema: schema,
          }),
    };
  });
};
