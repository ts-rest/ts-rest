import {
  type AppRoute,
  type AppRouter,
  isAppRouteOtherResponse,
} from '@ts-rest/core';
import type {
  ExamplesObject,
  InfoObject,
  OpenAPIObject,
  OperationObject,
  PathsObject,
  SchemaObject,
} from 'openapi3-ts';
import {
  PathSchemaResults,
  RouterPath,
  SchemaTransformer,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from './types';
import { performContractTraversal } from './contract-traversal';
import {
  convertSchemaObjectToMediaTypeObject,
  extractReferenceSchemas,
} from './utils';
import { ZOD_3_SCHEMA_TRANSFORMER } from './transformers';

declare module 'openapi3-ts' {
  interface SchemaObject {
    mediaExamples?: ExamplesObject;
  }
}

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
  /**
   * Default to ZOD_3_SCHEMA_TRANSFORMER to avoid a breaking change in 3.53.0
   */
  const transformSchema: SchemaTransformer =
    options?.schemaTransformer || ZOD_3_SCHEMA_TRANSFORMER;

  const paths = performContractTraversal.sync({
    contract: router,
    transformSchema,
    jsonQuery: !!options?.jsonQuery,
  });

  return traversedPathsToOpenApi(paths, apiDoc, {
    setOperationId: options?.setOperationId,
    jsonQuery: options?.jsonQuery,
    operationMapper: options?.operationMapper,
  });
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
  const paths = await performContractTraversal.async({
    contract: router,
    transformSchema: options.schemaTransformer,
    jsonQuery: !!options.jsonQuery,
  });

  return traversedPathsToOpenApi(paths, apiDoc, {
    setOperationId: options.setOperationId,
    jsonQuery: options.jsonQuery,
    operationMapper: options.operationMapper,
  });
}

/**
 * Inner function to be reused by both sync and async functions
 */
const traversedPathsToOpenApi = (
  paths: Array<RouterPath & { schemaResults: PathSchemaResults }>,
  apiDoc: Omit<OpenAPIObject, 'paths' | 'openapi'> & { info: InfoObject },
  options: {
    setOperationId?: boolean | 'concatenated-path';
    jsonQuery?: boolean;
    operationMapper?: (
      operation: OperationObject,
      appRoute: AppRoute,
      id: string,
    ) => OperationObject;
  },
) => {
  const mapMethod = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
  };

  const operationIds = new Map<string, string[]>();

  const referenceSchemas: { [id: string]: SchemaObject } = {};

  const pathObject: PathsObject = {};

  for (const path of paths) {
    if (options.setOperationId === true) {
      const existingOp = operationIds.get(path.id);
      if (existingOp) {
        throw new Error(
          `Route '${path.id}' already defined under ${existingOp.join('.')}`,
        );
      }
      operationIds.set(path.id, path.paths);
    }

    const _bodySchema = path.schemaResults.body;
    const bodySchema =
      _bodySchema && typeof _bodySchema === 'object' && 'title' in _bodySchema
        ? extractReferenceSchemas(
            path.schemaResults.body as SchemaObject,
            referenceSchemas,
          )
        : path.schemaResults.body;

    const responses: Record<string, SchemaObject> = {};

    for (const [statusCode, response] of Object.entries(path.route.responses)) {
      const contentType = isAppRouteOtherResponse(response)
        ? response.contentType
        : 'application/json';

      const responseSchemaObject = path.schemaResults.responses[statusCode];
      const responseSchemaObjectWithReferences = responseSchemaObject
        ? extractReferenceSchemas(responseSchemaObject, referenceSchemas)
        : null;

      const description =
        response &&
        typeof response === 'object' &&
        'description' in response &&
        response.description
          ? response.description
          : statusCode;

      responses[statusCode] = {
        description,
        ...(responseSchemaObjectWithReferences
          ? {
              content: {
                [contentType]: {
                  ...convertSchemaObjectToMediaTypeObject(
                    responseSchemaObjectWithReferences,
                  ),
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
      parameters: [
        ...path.schemaResults.path,
        ...path.schemaResults.headers,
        ...path.schemaResults.query,
      ],
      ...(options.setOperationId
        ? {
            operationId:
              options.setOperationId === 'concatenated-path'
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
      [mapMethod[path.route.method]]: options.operationMapper
        ? options.operationMapper(pathOperation, path.route, path.id)
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
};
