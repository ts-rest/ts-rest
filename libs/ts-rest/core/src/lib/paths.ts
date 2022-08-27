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
 * Any string like /posts/:id or /posts or /:id is valid
 */
export type ColonDelimitedPath<T extends string> = T extends `/${string}`
  ? T
  : never;
