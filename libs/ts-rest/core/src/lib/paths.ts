type RecursivelyExtractPathParams<
  T extends string,
  TAcc extends Record<string, string>
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
 */
type ParamsFromUrl<T extends string> =
  // eslint-disable-next-line @typescript-eslint/ban-types
  RecursivelyExtractPathParams<T, {}>;

const url = '/post/:id/comments/:commentId';
type Test = ParamsFromUrl<typeof url>;

const urlSimple = '/:idOne';
type TestSimple = ParamsFromUrl<typeof urlSimple>;

const urlOneDeep = '/test/:idEnd';
type TestOneDeep = ParamsFromUrl<typeof urlOneDeep>;

const urlIdThenKey = '/:idStart/test';
type TestIdThenKey = ParamsFromUrl<typeof urlIdThenKey>;
