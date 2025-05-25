import { AppRoute } from '@ts-rest/core';
import {
  AsyncAndSyncHelper,
  GetAsyncFunction,
  GetSyncFunction,
  SchemaTransformerAsync,
  SchemaTransformerSync,
} from '../types';
import { ParameterObject } from 'openapi3-ts';
import { schemaObjectToParameters } from './utils';

type GetPathParameterHelper = AsyncAndSyncHelper<
  {
    appRoute: AppRoute;
    id: string;
  },
  {
    transformSchema: SchemaTransformerSync;
  },
  {
    transformSchema: SchemaTransformerAsync;
  },
  Array<ParameterObject>
>;

/**
 * We build up the params from both the path and the schema.
 *
 * This builds up the record of name -> parameter object.
 */
export const getParamsFromPathOnly = (
  path: string,
): Map<string, ParameterObject> => {
  const params = new Map<string, ParameterObject>();

  const paramsInPath =
    path.match(/:([^/]+)/g)?.map((param) => param.slice(1)) || [];

  for (const param of paramsInPath) {
    params.set(param, {
      name: param,
      in: 'path' as const,
      required: true,
      schema: { type: 'string' },
    });
  }

  return params;
};

/**
 * Should return schema params as priority, and then path params as fallback
 *
 * @param pathParams - params inferred from the path i.e. just from the string
 * @param schemaParams - params from the schema
 */
const mergeParams = (
  pathParams: Map<string, ParameterObject>,
  schemaParams: Map<string, ParameterObject>,
): Array<ParameterObject> => {
  const resultMap = new Map<string, ParameterObject>();

  for (const [name, param] of pathParams.entries()) {
    resultMap.set(name, param);
  }

  for (const [name, param] of schemaParams.entries()) {
    resultMap.set(name, param);
  }

  return Array.from(resultMap.values());
};

const syncFunc: GetSyncFunction<GetPathParameterHelper> = ({
  transformSchema,
  appRoute,
  id,
}) => {
  const schema = appRoute.pathParams;

  const paramsMap = getParamsFromPathOnly(appRoute.path);

  const transformedSchema = transformSchema(schema, appRoute, id, 'path');

  if (!transformedSchema) {
    return Array.from(paramsMap.values());
  }

  const schemaParams = schemaObjectToParameters(transformedSchema, 'path');

  const schemaParamsMap = new Map(
    schemaParams.map((param) => [param.name, param]),
  );

  return mergeParams(paramsMap, schemaParamsMap);
};

const asyncFunc: GetAsyncFunction<GetPathParameterHelper> = async ({
  transformSchema,
  appRoute,
  id,
}) => {
  const schema = appRoute.pathParams;

  const paramsMap = getParamsFromPathOnly(appRoute.path);

  const transformedSchema = await transformSchema(schema, appRoute, id, 'path');

  if (!transformedSchema) {
    return Array.from(paramsMap.values());
  }

  const schemaParams = schemaObjectToParameters(transformedSchema, 'path');

  const schemaParamsMap = new Map(
    schemaParams.map((param) => [param.name, param]),
  );

  return mergeParams(paramsMap, schemaParamsMap);
};

export const getPathParameterSchema: GetPathParameterHelper = {
  sync: syncFunc,
  async: asyncFunc,
};
