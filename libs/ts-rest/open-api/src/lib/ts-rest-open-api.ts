import {
  AppRoute,
  AppRouter,
  getAppRoutePathRoute,
  isAppRoute,
} from '@ts-rest/core';
import {
  InfoObject,
  OpenAPIObject,
  OperationObject,
  PathsObject,
  ResponsesObject,
} from 'openapi3-ts';
import { ZodTypeAny } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const getPathsFromRouter = (
  router: AppRouter,
  pathHistory?: string[]
): { path: string; route: AppRoute; paths: string[] }[] => {
  const paths: { path: string; route: AppRoute; paths: string[] }[] = [];

  Object.keys(router).forEach((key) => {
    const value = router[key];

    if (isAppRoute(value)) {
      const path = getAppRoutePathRoute(value, {
        formatter: (param) => `{${param}}`,
      });

      paths.push({ path, route: value, paths: pathHistory ?? [] });
    } else {
      paths.push(...getPathsFromRouter(value, [...(pathHistory ?? []), key]));
    }
  });

  return paths;
};

const isAppRouteResponseStatusMap = (
  response: unknown
): response is { [key: number]: unknown } => {
  return (
    response instanceof Object &&
    Object.keys(response).length > 0 &&
    Object.keys(response).every((key) => Number.isSafeInteger(Number(key)))
  );
};

const isZodObject = (body: unknown): body is ZodTypeAny => {
  return (body as ZodTypeAny)?.safeParse !== undefined;
};

const getResponseSchemaFromZod = (response: unknown) =>
  isZodObject(response)
    ? zodToJsonSchema(response, {
        name: 'zodObject',
        target: 'openApi3',
      }).definitions['zodObject']
    : undefined;

const generateOpenApiResponses = (route: AppRoute): ResponsesObject => {
  const response = route.response;

  if (isAppRouteResponseStatusMap(response)) {
    return Object.keys(response).reduce((acc, key) => {
      const keyAsNumber = Number(key);

      const responseSchema = getResponseSchemaFromZod(response[keyAsNumber]);

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
  }

  const responseSchema = getResponseSchemaFromZod(response);

  return {
    200: {
      description: 'Success',
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
};

export const generateOpenApi = (
  router: AppRouter,
  options: Omit<OpenAPIObject, 'paths' | 'openapi'> & { info: InfoObject }
): OpenAPIObject => {
  const paths = getPathsFromRouter(router);

  const mapMethod = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
  };

  const pathObject = paths.reduce((acc, path) => {
    const paramsFromPath = path.path
      .match(/{[^}]+}/g)
      ?.map((param) => param.slice(1, -1));

    const bodySchema =
      path.route?.__tsType === 'AppRouteMutation' &&
      getResponseSchemaFromZod(path.route.response);

    const responses = generateOpenApiResponses(path.route);

    const newPath: OperationObject = {
      description: path.route.description,
      summary: path.route.summary,
      deprecated: path.route.deprecated,
      tags: path.paths,
      parameters: paramsFromPath?.map((param) => ({
        name: param,
        in: 'path',
        required: true,
      })),
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

  const document: OpenAPIObject = {
    openapi: '3.0.0',
    paths: pathObject,
    ...options,
  };

  return document;
};
