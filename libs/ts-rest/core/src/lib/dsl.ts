export type AppRouteQuery = {
  __type: 'AppRouteQuery';
  method: 'GET';
  path: PathFunction;
  response: unknown | { [status: number]: unknown };
  query?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
};

export type AppRouteMutation = {
  __type: 'AppRouteMutation';
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  path: PathFunction;
  response: unknown | { [status: number]: unknown };
  body: unknown;
  query?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
};

export type AppRoute = AppRouteQuery | AppRouteMutation;

export type AppRouter = {
  [key: string]: AppRouter | AppRoute;
};

export const isAppRoute = (obj: AppRoute | AppRouter): obj is AppRoute => {
  return obj.method !== undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PathFunction = (arg: any) => string;

type tsRest = {
  router: <
    T extends {
      [key: string]: AppRoute | AppRouter;
    }
  >(
    endpoints: T
  ) => T;
  query: <
    T extends {
      method: 'GET';
      path: P;
      response: unknown | { [status: number]: unknown };
      query: unknown;
      description?: string;
      summary?: string;
      deprecated?: boolean;
    },
    P extends PathFunction
  >(
    query: T
  ) => T & { __type: 'AppRouteQuery' };
  mutation: <
    T extends {
      method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
      path: P;
      response: unknown;
      body: unknown;
      description?: string;
      summary?: string;
      deprecated?: boolean;
    },
    P extends PathFunction
  >(
    mutation: T
  ) => T & { __type: 'AppRouteMutation' };
  response: <T>() => T;
  body: <T>() => T;
  path: <T>() => T;
};

export const initTsRest = (): tsRest => {
  return {
    router: (args) => args,
    query: (args) => ({ __type: 'AppRouteQuery', ...args }),
    mutation: (args) => ({ __type: 'AppRouteMutation', ...args }),
    response: <T>() => '' as unknown as T,
    body: <T>() => '' as unknown as T,
    path: <T>() => '' as unknown as T,
  };
};
