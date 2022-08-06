import { AppRouter, getAppRoutePathRoute, isAppRoute } from '@ts-rest/core';
import { OpenAPIObject, PathsObject } from 'openapi3-ts';

const getPathsFromRouter = (router: AppRouter): string[] => {
  const paths: string[] = [];

  Object.keys(router).forEach((key) => {
    const value = router[key];

    if (isAppRoute(value)) {
      const path = getAppRoutePathRoute(value);

      paths.push(path);
    } else {
      paths.push(...getPathsFromRouter(value));
    }
  });

  return paths;
};

export const generateOpenApi = (router: AppRouter): OpenAPIObject => {
  const paths = getPathsFromRouter(router);

  const pathObject = paths.reduce((acc, path) => {
    acc[path] = {
      put: {
        description: 'Get all',
        responses: {
          200: {
            description: 'Success',
          },
        },
      },
    };

    return acc;
  }, {} as PathsObject);

  console.log('done 4');

  const document: OpenAPIObject = {
    openapi: '3.0.0',
    paths: pathObject,
    components: { schemas: {} },

    info: {
      title: 'Example Nest',
      version: '1.0.0',
    },
  };

  return document;
};
