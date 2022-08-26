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

/**
 * Extract path params from url
 * @param url e.g. /posts/1/comments/2?unwanted-query-param=true
 * @param appRoute
 * @returns
 */
export const getPathParamsFromUrl = (
  url: string,
  appRoute: AppRoute
): Record<string, string> => {
  const baseUrl = url.split('?')[0];
  const baseUrlAsArr = baseUrl.split('/').slice(1);

  return getPathParamsFromArray(baseUrlAsArr, appRoute);
};

/**
 * Get path params from array of url segments
 * @param urlChunks ['posts', '1', 'comments', '2']
 * @param appRoute
 * @returns
 */
export const getPathParamsFromArray = (
  urlChunks: string[],
  appRoute: AppRoute
): Record<string, string> => {
  const paths = getAppRoutePathRoute(appRoute);

  const pathAsArr = paths.split('/').slice(1);

  const pathParams: Record<string, string> = {};

  urlChunks.forEach((baseUrlPart, index) => {
    pathParams[pathAsArr[index]] = baseUrlPart;
  });

  // remove pathParams where key doesn't start with :
  const pathParamsWithoutColons = Object.entries(pathParams).reduce(
    (acc, [key, value]) => {
      if (key.startsWith(':')) {
        const keyWithoutColon = key.slice(1);
        acc[keyWithoutColon] = value;
      }

      return acc;
    },
    {} as Record<string, string>
  );

  return pathParamsWithoutColons;
};
