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
type RecursivelyExtractPathParams<T extends string> = T extends ''
  ? Record<never, never>
  : T extends `${infer Left}/:${infer PathParam}/${infer Right}`
  ? ResolveOptionalPathParam<PathParam> &
      RecursivelyExtractPathParams<Left> &
      RecursivelyExtractPathParams<Right>
  : T extends `:${infer PathParam}/${infer Right}`
  ? ResolveOptionalPathParam<PathParam> & RecursivelyExtractPathParams<Right>
  : T extends `${infer Left}/:${infer PathParam}`
  ? ResolveOptionalPathParam<PathParam> & RecursivelyExtractPathParams<Left>
  : T extends `:${infer PathParam}`
  ? ResolveOptionalPathParam<PathParam>
  : Record<never, never>;

/**
 * Extract path params from path function
 *
 * `{ id: string, commentId: string }`
 *
 * @params T - The URL e.g. /posts/:id
 */
export type ParamsFromUrl<T extends string> =
  RecursivelyExtractPathParams<T> extends infer U
    ? {
        [key in keyof U]: U[key];
      }
    : never;

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
  const pathParams = params as Record<string, string>;

  return path.replace(/\/?:([^/?]+)\??/g, (matched, p) =>
    pathParams[p]
      ? `${matched.startsWith('/') ? '/' : ''}${pathParams[p]}`
      : '',
  );
};
