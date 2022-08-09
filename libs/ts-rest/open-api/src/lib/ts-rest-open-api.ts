import {
  AppRoute,
  AppRouter,
  getAppRoutePathRoute,
  isAppRoute,
} from '@ts-rest/core';
import { OpenAPIObject, OperationObject, PathsObject } from 'openapi3-ts';
import { z } from 'zod';
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

export const generateOpenApi = (router: AppRouter): OpenAPIObject => {
  const paths = getPathsFromRouter(router);

  const mapMethod = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
  };

  const isZodObject = (
    body: unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): body is z.ZodObject<any, any, any, any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (body as z.ZodObject<any, any, any, any>)?.safeParse !== undefined;
  };
  const pathObject = paths.reduce((acc, path) => {
    const paramsFromPath = path.path
      .match(/{[^}]+}/g)
      ?.map((param) => param.slice(1, -1));

    const bodySchema =
      path.route?.__type === 'AppRouteMutation' && isZodObject(path.route.body)
        ? zodToJsonSchema(path.route.body, {
            name: 'zodObject',
            target: 'openApi3',
          }).definitions['zodObject']
        : undefined;

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
                ['application/json']: {
                  schema: bodySchema,
                },
              },
            },
          }
        : {}),
      responses: {
        200: {
          description: 'Success',
        },
      },
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
    components: {},
    info: {
      title: 'Posts API',
      version: '1.0.0',
    },
  };

  return document;
};
