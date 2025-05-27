import { AppRouter, isAppRoute, isAppRouteOtherResponse } from '@ts-rest/core';
import {
  AsyncAndSyncHelper,
  GetAsyncFunction,
  GetSyncFunction,
  PathSchemaResults,
  RouterPath,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from './types';
import { getPathParameterSchema } from './parsers/path-params';
import { getHeaderParameterSchema } from './parsers/headers';
import { getQueryParameterSchema } from './parsers/query-params';
import { getBodySchema } from './parsers/body';
import { SchemaObject } from 'openapi3-ts';

type PerformContractTraversalHelper = AsyncAndSyncHelper<
  {
    contract: AppRouter;
    jsonQuery: boolean;
  },
  {
    transformSchema: SchemaTransformerSync;
  },
  {
    transformSchema: SchemaTransformerAsync;
  },
  Array<RouterPath & { schemaResults: PathSchemaResults }>
>;

/**
 * Recursively step through the router and get all the individual routes with their paths etc.
 */
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

const syncFunc: GetSyncFunction<PerformContractTraversalHelper> = ({
  contract,
  transformSchema,
  jsonQuery,
}) => {
  const paths = getPathsFromRouter(contract);

  const results: Array<RouterPath & { schemaResults: PathSchemaResults }> = [];

  for (const path of paths) {
    const concatenatedPath = [...path.paths, path.id].join('.');

    const pathParams = getPathParameterSchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
    });

    const headerParams = getHeaderParameterSchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
    });

    const querySchema = getQueryParameterSchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
      jsonQuery: !!jsonQuery,
    });

    const bodySchema = getBodySchema.sync({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
    });

    const responses: Record<string, SchemaObject> = {};
    for (const [statusCode, _response] of Object.entries(
      path.route.responses,
    )) {
      const schemaValidator = isAppRouteOtherResponse(_response)
        ? _response.body
        : _response;

      const responseSchema = transformSchema({
        schema: schemaValidator,
        appRoute: path.route,
        id: path.id,
        concatenatedPath,
        type: 'response',
      });

      if (responseSchema) {
        responses[statusCode] = responseSchema;
      }
    }

    results.push({
      ...path,
      schemaResults: {
        path: pathParams,
        headers: headerParams,
        query: querySchema,
        body: bodySchema,
        responses,
      },
    });
  }

  return results;
};

const asyncFunc: GetAsyncFunction<PerformContractTraversalHelper> = async ({
  contract,
  transformSchema,
  jsonQuery,
}) => {
  const paths = getPathsFromRouter(contract);

  const results: Array<RouterPath & { schemaResults: PathSchemaResults }> = [];

  for (const path of paths) {
    const concatenatedPath = [...path.paths, path.id].join('.');

    const pathParams = await getPathParameterSchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
    });

    const headerParams = await getHeaderParameterSchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
    });

    const querySchema = await getQueryParameterSchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
      jsonQuery: !!jsonQuery,
    });

    const bodySchema = await getBodySchema.async({
      transformSchema,
      appRoute: path.route,
      id: path.id,
      concatenatedPath,
    });

    const responses: Record<string, SchemaObject> = {};
    for (const [statusCode, _response] of Object.entries(
      path.route.responses,
    )) {
      const schemaValidator = isAppRouteOtherResponse(_response)
        ? _response.body
        : _response;

      const responseSchema = await transformSchema({
        schema: schemaValidator,
        appRoute: path.route,
        id: path.id,
        concatenatedPath,
        type: 'response',
      });

      if (responseSchema) {
        responses[statusCode] = responseSchema;
      }
    }

    results.push({
      ...path,
      schemaResults: {
        path: pathParams,
        headers: headerParams,
        query: querySchema,
        body: bodySchema,
        responses,
      },
    });
  }

  return results;
};

export const performContractTraversal: PerformContractTraversalHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
