type ResolveOptionalPathParam<T extends string> =
  T extends `${infer PathParam}?`
    ? {
        [key in PathParam]?: string | undefined;
      }
    : {
        [key in T]: string;
      };

/**
 * @params T - The URL e.g. /posts/:id
 * @params TAcc - Accumulator object
 */
type RecursivelyExtractPathParams<
  T extends string,
  TAcc extends null | Record<string, string>,
> = T extends `/:${infer PathParam}(${string})/${infer Right}`
  ? ResolveOptionalPathParam<PathParam> &
      RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/:${infer PathParam}/${infer Right}`
  ? ResolveOptionalPathParam<PathParam> &
      RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/:${infer PathParam}(${string})`
  ? ResolveOptionalPathParam<PathParam>
  : T extends `/:${infer PathParam}`
  ? ResolveOptionalPathParam<PathParam>
  : T extends `/${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : T extends `/${string}`
  ? TAcc
  : T extends `:${infer PathParam}(${string})/${infer Right}`
  ? ResolveOptionalPathParam<PathParam> &
      RecursivelyExtractPathParams<Right, TAcc>
  : T extends `:${infer PathParam}/${infer Right}`
  ? ResolveOptionalPathParam<PathParam> &
      RecursivelyExtractPathParams<Right, TAcc>
  : T extends `:${infer PathParam}(${string})`
  ? TAcc & ResolveOptionalPathParam<PathParam>
  : T extends `:${infer PathParam}`
  ? TAcc & ResolveOptionalPathParam<PathParam>
  : T extends `${string}/${infer Right}`
  ? RecursivelyExtractPathParams<Right, TAcc>
  : TAcc;

/**
 * Extract path params from path function
 *
 * `{ id: string, commentId: string }`
 *
 * @params T - The URL e.g. /posts/:id
 */
export type ParamsFromUrl<T extends string> = RecursivelyExtractPathParams<
  T,
  {}
> extends infer U
  ? {
      [key in keyof U]: U[key];
    }
  : never;

const PARAM_REGEX = /:([^/?]+)\??/g;
const DOUBLE_SLASH_REGEX = /\/\//g;

/**
 * @param path - The URL e.g. /posts/:id
 * @param params - The params e.g. `{ id: string }`
 * @returns - The URL with the params e.g. /posts/123
 */
export const insertParamsIntoPath = <T extends string>({
  path,
  params,
}: {
  path: T;
  params: ParamsFromUrl<T>;
}) => {
  let result = path
    .replace(PARAM_REGEX, (_, p) => {
      const paramName = p.replace(/\(.*\)$/, '');

      return (params as Record<string, string>)[paramName] || '';
    })
    .replace(DOUBLE_SLASH_REGEX, '/');

  while (result.length > 1 && result.endsWith('/')) {
    result = result.slice(0, -1);
  }

  return result;
};
