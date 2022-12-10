/**
 * @params T - The URL e.g. /posts/:id
 * @params TAcc - Accumulator object
 */
type RecursivelyExtractPathParams<
  T extends string,
  TAcc extends null | Record<string, string>
> = T extends `/:${infer PathParam}/${infer Right}`
  ? { [key in PathParam]: string } & RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/:${infer PathParam}`
  ? { [key in PathParam]: string }
  : T extends `/${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/${string}`
  ? TAcc
  : T extends `:${infer PathParam}/${infer Right}`
  ? { [key in PathParam]: string } & RecursivelyExtractPathParams<Right, TAcc>
  : T extends `:${infer PathParam}`
  ? TAcc & { [key in PathParam]: string }
  : T extends `${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : TAcc;

/**
 * Extract path params from path function
 *
 * { id: string, commentId: string }
 *
 * @params T - The URL e.g. /posts/:id
 */
export type ParamsFromUrl<T extends string> = RecursivelyExtractPathParams<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
> extends infer U
  ? keyof U extends never
    ? undefined
    : {
        [key in keyof U]: U[key];
      }
  : never;

/**
 * @param path - The URL e.g. /posts/:id
 * @param params - The params e.g. { id: string }
 * @returns - The URL with the params e.g. /posts/123
 */
export const insertParamsIntoPath = <T extends string>({
  path,
  params,
}: {
  path: T;
  params: ParamsFromUrl<T>;
}) => {
  return path
    .replace(/:([^/]+)/g, (_, p) => {
      return params?.[p] || '';
    })
    .replace(/\/\//g, '/');
};

/**
 *
 * @param query - Any JSON object
 * @returns - The query url segment, using explode array syntax, and deep object syntax
 */
export const convertQueryParamsToUrlString = (
  query: Record<string, unknown>
) => {
  const tokens = Object.keys(query).flatMap((key) =>
    tokeniseValue(key, query[key])
  );

  const queryString = tokens.join('&');

  return queryString?.length > 0 ? '?' + queryString : '';
};

const tokeniseValue = (key: string, value: unknown): string[] => {
  // if array, recurse
  if (Array.isArray(value)) {
    return value.flatMap((v) => tokeniseValue(key, v));
  }

  if (value instanceof Date) {
    return [`${key}=${value.toISOString()}`];
  }

  if (value === null) {
    return [`${key}=`];
  }

  if (value === undefined) {
    return [];
  }

  // if object, recurse
  if (typeof value === 'object') {
    return Object.keys(value).flatMap((k) =>
      // @ts-expect-error - accessing object keys
      tokeniseValue(`${key}[${k}]`, value[k])
    );
  }

  return [`${key}=${value}`];
};
