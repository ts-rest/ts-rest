import { AppRoute } from './dsl';

/**
 *  We don't know the path params at runtime, so use a proxy object to create the routes
 *  E.g. ({id, commentId}) => `/posts/:id/comments/:commentId`
 */
export const getAppRoutePathRoute = (
  schema: AppRoute,
  options?: { formatter?: (param: string) => string }
): string => {
  const proxyObj: Record<string, string> = {};
  const pathParamGenerator = new Proxy(proxyObj, {
    get: (_, key) => {
      return options?.formatter
        ? options.formatter(String(key))
        : `:${String(key)}`;
    },
  });

  const generatedPath = schema.path(pathParamGenerator);

  return generatedPath;
};
