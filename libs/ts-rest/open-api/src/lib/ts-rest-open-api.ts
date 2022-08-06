import {
  AppRoute,
  AppRouter,
  getAppRoutePathRoute,
  isAppRoute,
} from '@ts-rest/core';
import { OpenAPIObject, PathItemObject, PathsObject } from 'openapi3-ts';

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

  const pathObject = paths.reduce((acc, path) => {
    const paramsFromPath = path.path
      .match(/{[^}]+}/g)
      ?.map((param) => param.slice(1, -1));

    const newPath: PathItemObject = {
      description: path.route.description,
      summary: path.route.summary,
      deprecated: path.route.deprecated,
      tags: path.paths,
      parameters: paramsFromPath?.map((param) => ({
        name: param,
        in: 'path',
        required: true,
      })),
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
    components: { schemas: {} },

    info: {
      title: 'Posts API',
      version: '1.0.0',
    },
  };

  return document;
};
