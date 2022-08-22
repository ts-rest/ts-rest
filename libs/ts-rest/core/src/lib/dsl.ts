export type AppRouteQuery = {
  __tsType: 'AppRouteQuery';
  method: 'GET';
  path: PathFunction;
  query?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  responses: {
    [status: number]: unknown;
  };
};

export type AppRouteMutation = {
  __tsType: 'AppRouteMutation';
  method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  path: PathFunction;
  body: unknown;
  query?: unknown;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  responses: {
    [status: number]: unknown;
  };
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
      query: unknown;
      description?: string;
      summary?: string;
      deprecated?: boolean;
      responses: {
        [status: number]: unknown;
      };
    },
    P extends PathFunction
  >(
    query: T
  ) => T & { __tsType: 'AppRouteQuery' };
  mutation: <
    T extends {
      method: 'POST' | 'DELETE' | 'PUT' | 'PATCH';
      path: P;
      body: unknown;
      description?: string;
      summary?: string;
      deprecated?: boolean;
      responses: {
        [status: number]: unknown;
      };
    },
    P extends PathFunction
  >(
    mutation: T
  ) => T & { __tsType: 'AppRouteMutation' };
  response: <T>() => T;
  body: <T>() => T;
  path: <T>() => T;
};

export const initTsRest = (): tsRest => {
  return {
    router: (args) => args,
    query: (args) => ({ __tsType: 'AppRouteQuery', ...args }),
    mutation: (args) => ({ __tsType: 'AppRouteMutation', ...args }),
    response: <T>() => '' as unknown as T,
    body: <T>() => '' as unknown as T,
    path: <T>() => '' as unknown as T,
  };
};
