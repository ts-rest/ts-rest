import { AppRoute, AppRouter, isAppRoute, isZodObject } from '@ts-rest/core';
import {
  InfoObject,
  OpenAPIObject,
  OperationObject,
  PathsObject,
} from 'openapi3-ts';
import zodToJsonSchema from 'zod-to-json-schema';

type RouterPath = {
  id: string;
  path: string;
  route: AppRoute;
  paths: string[];
};

const getPathsFromRouter = (
  router: AppRouter,
  pathHistory?: string[]
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

const getJsonSchemaFromZod = (zodObject: unknown) => {
  const isZodObj = isZodObject(zodObject);

  if (!isZodObj) {
    return null;
  }
  const schema = zodToJsonSchema(zodObject, {
    name: 'zodObject',
    target: 'openApi3',
    $refStrategy: 'none',
  });

  return schema.definitions['zodObject'];
};

export const generateOpenApi = (
  router: AppRouter,
  apiDoc: Omit<OpenAPIObject, 'paths' | 'openapi'> & { info: InfoObject },
  options: { setOperationId?: boolean } = {}
): OpenAPIObject => {
  const paths = getPathsFromRouter(router);

  const mapMethod = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
  };

  const operationIds = new Map<string, string[]>();

  const pathObject = paths.reduce((acc, path) => {
    if (options.setOperationId) {
      const existingOp = operationIds.get(path.id);
      if (existingOp) {
        throw new Error(
          `Route '${path.id}' already defined under ${existingOp.join('.')}`
        );
      }
      operationIds.set(path.id, path.paths);
    }

    const paramsFromPath = path.path
      .match(/{[^}]+}/g)
      ?.map((param) => param.slice(1, -1));

    const querySchema = getJsonSchemaFromZod(path.route.query);

    const bodySchema =
      path.route?.method !== 'GET'
        ? getJsonSchemaFromZod(path.route.body)
        : null;

    const responses = Object.keys(path.route.responses).reduce((acc, key) => {
      const keyAsNumber = Number(key);

      const responseSchema = getJsonSchemaFromZod(
        path.route.responses[keyAsNumber]
      );

      return {
        ...acc,
        [keyAsNumber]: {
          description: `${keyAsNumber}`,
          ...(responseSchema
            ? {
                content: {
                  'application/json': {
                    schema: responseSchema,
                  },
                },
              }
            : {}),
        },
      };
    }, {});

    const newPath: OperationObject = {
      description: path.route.description,
      summary: path.route.summary,
      deprecated: path.route.deprecated,
      tags: path.paths,
      parameters: [
        ...(paramsFromPath
          ? paramsFromPath.map((param) => ({
              name: param,
              in: 'path' as const,
              required: true,
            }))
          : []),
        ...(querySchema
          ? [
              {
                name: 'query',
                in: 'query' as const,
                schema: querySchema,
              },
            ]
          : []),
      ],
      ...(options.setOperationId ? { operationId: path.id } : {}),
      ...(bodySchema
        ? {
            requestBody: {
              description: 'Body',
              content: {
                'application/json': {
                  schema: bodySchema,
                },
              },
            },
          }
        : {}),
      responses,
    };

    acc[path.path] = {
      ...acc[path.path],
      [mapMethod[path.route.method]]: newPath,
    };

    return acc;
  }, {} as PathsObject);

  return {
    openapi: '3.0.0',
    paths: pathObject,
    ...apiDoc,
  };
};
