import {
  type AppRoute,
  type AppRouter,
  isAppRoute,
  isAppRouteOtherResponse,
} from '@ts-rest/core';
import type {
  ExamplesObject,
  InfoObject,
  MediaTypeObject,
  OpenAPIObject,
  OperationObject,
  PathsObject,
  ReferenceObject,
  SchemaObject,
} from 'openapi3-ts';
import { generateSchema } from '@anatine/zod-openapi';
import { z } from 'zod';
import {
  SchemaTransformer,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from './types';
import {
  getPathParameterSchema,
  getHeaderParameterSchema,
  getQueryParameterSchema,
  getBodySchema,
} from './parsers';

type RouterPath = {
  id: string;
  path: string;
  route: AppRoute;
  paths: string[];
};

const getPathsFromRouter = (
  router: AppRouter,
  pathHistory?: string[],
): RouterPath[] => {
  const paths: RouterPath[] = [];

  Object.keys(router).forEach((key) => {
    const value = router[key];

    if (isAppRoute(value)) {
      const pathWithPathParams = value.path.replace(/:(\w+)/g, '{$1}');

      paths.push({
        id: key,
        path: pathWithPathParams,
        route: value,
        paths: pathHistory ?? [],
      });
    } else {
      paths.push(...getPathsFromRouter(value, [...(pathHistory ?? []), key]));
    }
  });

  return paths;
};

const isZodType = (obj: unknown): obj is z.ZodTypeAny => {
  return typeof (obj as z.ZodTypeAny)?.safeParse === 'function';
};

/**
 * Default schema transformer that uses @anatine/zod-openapi
 * Maintains backward compatibility with existing behavior
 *
 * This should be removed from the library in the future, we could expose copy-pastable code instead
 */
export const ZOD_3_SCHEMA_TRANSFORMER: SchemaTransformer = (
  schema: unknown,
  _appRoute: AppRoute,
  _id: string,
  _type: 'body' | 'response' | 'query' | 'header' | 'path',
  useOutput = false,
) => {
  if (!isZodType(schema)) {
    return null;
  }

  return generateSchema(schema, useOutput);
};

/*
  TODO: end zod-utils.ts
*/

declare module 'openapi3-ts' {
  interface SchemaObject {
    mediaExamples?: ExamplesObject;
  }
}

const convertSchemaObjectToMediaTypeObject = (
  input: SchemaObject,
): MediaTypeObject => {
  const { mediaExamples: examples, ...schema } = input;

  return {
    schema,
    ...(examples && { examples }),
  };
};

const extractReferenceSchemas = (
  schema: SchemaObject,
  referenceSchemas: { [id: string]: SchemaObject },
): SchemaObject => {
  if (schema.allOf) {
    schema.allOf = schema.allOf?.map((subSchema) =>
      extractReferenceSchemas(subSchema, referenceSchemas),
    );
  }

  if (schema.anyOf) {
    schema.anyOf = schema.anyOf?.map((subSchema) =>
      extractReferenceSchemas(subSchema, referenceSchemas),
    );
  }

  if (schema.oneOf) {
    schema.oneOf = schema.oneOf?.map((subSchema) =>
      extractReferenceSchemas(subSchema, referenceSchemas),
    );
  }

  if (schema.not) {
    schema.not = extractReferenceSchemas(schema.not, referenceSchemas);
  }

  if (schema.items) {
    schema.items = extractReferenceSchemas(schema.items, referenceSchemas);
  }

  if (schema.properties) {
    schema.properties = Object.entries(schema.properties).reduce<{
      [p: string]: SchemaObject | ReferenceObject;
    }>((prev, [propertyName, schema]) => {
      prev[propertyName] = extractReferenceSchemas(schema, referenceSchemas);
      return prev;
    }, {});
  }

  if (schema.additionalProperties) {
    schema.additionalProperties =
      typeof schema.additionalProperties != 'boolean'
        ? extractReferenceSchemas(schema.additionalProperties, referenceSchemas)
        : schema.additionalProperties;
  }

  if (schema.title) {
    const nullable = schema.nullable;
    schema.nullable = undefined;
    if (schema.title in referenceSchemas) {
      if (
        JSON.stringify(referenceSchemas[schema.title]) !==
        JSON.stringify(schema)
      ) {
        throw new Error(
          `Schema title '${schema.title}' already exists with a different schema`,
        );
      }
    } else {
      referenceSchemas[schema.title] = schema;
    }

    if (nullable) {
      schema = {
        nullable: true,
        allOf: [
          {
            $ref: `#/components/schemas/${schema.title}`,
          },
        ],
      };
    } else {
      schema = {
        $ref: `#/components/schemas/${schema.title}`,
      };
    }
  }
  return schema;
};

/**
 * Generate OpenAPI specification from ts-rest router
 *
 * @param router - The ts-rest router to generate OpenAPI from
 * @param apiDoc - Base OpenAPI document configuration
 * @param options - Generation options
 * @param options.setOperationId - Whether to set operation IDs (true, false, or 'concatenated-path')
 * @param options.jsonQuery - Enable JSON query parameters, [see](/docs/open-api#json-query-params)
 * @param options.operationMapper - Function to customize OpenAPI operations. Receives the operation object, app route, and operation ID
 * @returns OpenAPI specification object
 */
export function generateOpenApi(
  router: AppRouter,
  apiDoc: Omit<OpenAPIObject, 'paths' | 'openapi'> & { info: InfoObject },
  options?: {
    setOperationId?: boolean | 'concatenated-path';
    jsonQuery?: boolean;
    operationMapper?: (
      operation: OperationObject,
      appRoute: AppRoute,
      id: string,
    ) => OperationObject;
    schemaTransformer?: SchemaTransformerSync;
  },
): OpenAPIObject {
  const paths = getPathsFromRouter(router);
  const opts = options || {};

  const mapMethod = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
  };

  const operationIds = new Map<string, string[]>();

  const referenceSchemas: { [id: string]: SchemaObject } = {};

  // Use provided transformer or default
  const transformSchema: SchemaTransformer =
    opts.schemaTransformer || ZOD_3_SCHEMA_TRANSFORMER;

  const pathObject = paths.reduce((acc, path) => {
    if (opts.setOperationId === true) {
      const existingOp = operationIds.get(path.id);
      if (existingOp) {
        throw new Error(
          `Route '${path.id}' already defined under ${existingOp.join('.')}`,
        );
      }
      operationIds.set(path.id, path.paths);
    }

    const pathParams = getPathParameterSchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
    });

    const headerParams = getHeaderParameterSchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
    });

    const querySchema = getQueryParameterSchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      jsonQuery: !!opts.jsonQuery,
    });

    let bodySchema = getBodySchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
    });

    if (bodySchema?.title) {
      bodySchema = extractReferenceSchemas(bodySchema, referenceSchemas);
    }

    const responses = Object.entries(path.route.responses).reduce(
      (acc, [statusCode, response]) => {
        let contentType = 'application/json';
        let responseBody = response;

        if (isAppRouteOtherResponse(response)) {
          contentType = response.contentType;
          responseBody = response.body;
        }

        let responseSchema = transformSchema(
          responseBody,
          path.route,
          path.id,
          'response',
          true,
        );

        const description =
          response &&
          typeof response === 'object' &&
          'description' in response &&
          response.description
            ? response.description
            : statusCode;

        if (responseSchema) {
          responseSchema = extractReferenceSchemas(
            responseSchema,
            referenceSchemas,
          );
        }

        return {
          ...acc,
          [statusCode]: {
            description,
            ...(responseSchema
              ? {
                  content: {
                    [contentType]: {
                      ...convertSchemaObjectToMediaTypeObject(responseSchema),
                    },
                  },
                }
              : {}),
          },
        };
      },
      {},
    );

    const contentType =
      path.route?.method !== 'GET' && 'contentType' in path.route
        ? path.route?.contentType ?? 'application/json'
        : 'application/json';

    const pathOperation: OperationObject = {
      description: path.route.description,
      summary: path.route.summary,
      deprecated: path.route.deprecated,
      tags: path.paths,
      parameters: [...pathParams, ...headerParams, ...querySchema],
      ...(opts.setOperationId
        ? {
            operationId:
              opts.setOperationId === 'concatenated-path'
                ? [...path.paths, path.id].join('.')
                : path.id,
          }
        : {}),
      ...(bodySchema
        ? {
            requestBody: {
              description: 'Body',
              content: {
                [contentType]: {
                  ...convertSchemaObjectToMediaTypeObject(bodySchema),
                },
              },
            },
          }
        : {}),
      responses,
    };

    acc[path.path] = {
      ...acc[path.path],
      [mapMethod[path.route.method]]: opts.operationMapper
        ? opts.operationMapper(pathOperation, path.route, path.id)
        : pathOperation,
    };

    return acc;
  }, {} as PathsObject);

  if (Object.keys(referenceSchemas).length) {
    apiDoc['components'] = {
      schemas: {
        ...referenceSchemas,
      },
      ...apiDoc['components'],
    };
  }

  return {
    openapi: '3.0.2',
    paths: pathObject,
    ...apiDoc,
  };
}

/**
 * Generate OpenAPI specification from ts-rest router with custom schema transformer
 *
 * @param router - The ts-rest router to generate OpenAPI from
 * @param apiDoc - Base OpenAPI document configuration
 * @param options - Generation options
 * @param options.setOperationId - Whether to set operation IDs (true, false, or 'concatenated-path')
 * @param options.jsonQuery - Enable JSON query parameters, [see](/docs/open-api#json-query-params)
 * @param options.operationMapper - Function to customize OpenAPI operations. Receives the operation object, app route, and operation ID
 * @param options.schemaTransformer - Custom schema transformer function. Defaults to ANATINE_ZOD_OPENAPI_SCHEMA_TRANSFORMER
 * @returns Promise<OpenAPIObject> when using custom schema transformer
 */
export async function generateOpenApiAsync(
  router: AppRouter,
  apiDoc: Omit<OpenAPIObject, 'paths' | 'openapi'> & { info: InfoObject },
  options: {
    setOperationId?: boolean | 'concatenated-path';
    jsonQuery?: boolean;
    operationMapper?: (
      operation: OperationObject,
      appRoute: AppRoute,
      id: string,
    ) => OperationObject;
    schemaTransformer: SchemaTransformerAsync;
  },
): Promise<OpenAPIObject> {
  const paths = getPathsFromRouter(router);
  const opts = options || {};

  const mapMethod = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
  };

  const operationIds = new Map<string, string[]>();

  const referenceSchemas: { [id: string]: SchemaObject } = {};

  // Use provided transformer or default
  const transformSchema: SchemaTransformerAsync = opts.schemaTransformer;

  const pathObject: PathsObject = {};

  for (const path of paths) {
    if (opts.setOperationId === true) {
      const existingOp = operationIds.get(path.id);
      if (existingOp) {
        throw new Error(
          `Route '${path.id}' already defined under ${existingOp.join('.')}`,
        );
      }
      operationIds.set(path.id, path.paths);
    }

    const pathParams = await getPathParameterSchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
    });

    const headerParams = await getHeaderParameterSchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
    });

    const querySchema = await getQueryParameterSchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      jsonQuery: !!opts.jsonQuery,
    });

    let bodySchema = await getBodySchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
    });

    if (bodySchema && typeof bodySchema === 'object' && 'title' in bodySchema) {
      bodySchema = extractReferenceSchemas(
        bodySchema as SchemaObject,
        referenceSchemas,
      );
    }

    const responses: any = {};
    for (const [statusCode, response] of Object.entries(path.route.responses)) {
      let contentType = 'application/json';
      let responseBody = response;

      if (isAppRouteOtherResponse(response)) {
        contentType = response.contentType;
        responseBody = response.body;
      }

      let responseSchema = await transformSchema(
        responseBody,
        path.route,
        path.id,
        'response',
        true,
      );
      const description =
        response &&
        typeof response === 'object' &&
        'description' in response &&
        response.description
          ? response.description
          : statusCode;

      if (responseSchema) {
        responseSchema = extractReferenceSchemas(
          responseSchema,
          referenceSchemas,
        );
      }

      responses[statusCode] = {
        description,
        ...(responseSchema
          ? {
              content: {
                [contentType]: {
                  ...convertSchemaObjectToMediaTypeObject(responseSchema),
                },
              },
            }
          : {}),
      };
    }

    const contentType =
      path.route?.method !== 'GET' && 'contentType' in path.route
        ? path.route?.contentType ?? 'application/json'
        : 'application/json';

    const pathOperation: OperationObject = {
      description: path.route.description,
      summary: path.route.summary,
      deprecated: path.route.deprecated,
      tags: path.paths,
      parameters: [...pathParams, ...headerParams, ...querySchema],
      ...(opts.setOperationId
        ? {
            operationId:
              opts.setOperationId === 'concatenated-path'
                ? [...path.paths, path.id].join('.')
                : path.id,
          }
        : {}),
      ...(bodySchema
        ? {
            requestBody: {
              description: 'Body',
              content: {
                [contentType]: {
                  ...convertSchemaObjectToMediaTypeObject(bodySchema),
                },
              },
            },
          }
        : {}),
      responses,
    };

    pathObject[path.path] = {
      ...pathObject[path.path],
      [mapMethod[path.route.method]]: opts.operationMapper
        ? opts.operationMapper(pathOperation, path.route, path.id)
        : pathOperation,
    };
  }

  if (Object.keys(referenceSchemas).length) {
    apiDoc['components'] = {
      schemas: {
        ...referenceSchemas,
      },
      ...apiDoc['components'],
    };
  }

  return {
    openapi: '3.0.2',
    paths: pathObject,
    ...apiDoc,
  };
}
