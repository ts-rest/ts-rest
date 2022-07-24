type AppRoute = {
  method: string;
  path: PathFunction;
  response: unknown;
};

// AppRouter contains either { [string]: AppRouter | AppRoute}
type AppRouter = {
  [key: string]: AppRouter | AppRoute;
};

type RecursiveProxyObj<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RecursiveProxyObj<T[TKey]>
    : T[TKey] extends AppRoute
    ? DataReturn<T[TKey]>
    : never;
};

type DataReturn<TRoute extends AppRoute> = Parameters<
  TRoute['path']
>[0] extends undefined
  ? () => Promise<{ data: TRoute['response']; status: number }>
  : (
      path: Parameters<TRoute['path']>[0]
    ) => Promise<{ data: TRoute['response']; status: number }>;

const isAppRoute = (obj: AppRoute | AppRouter): obj is AppRoute => {
  return (obj as AppRoute).method !== undefined;
};

const getRouteQuery = (route: AppRoute, args: ClientArgs) => {
  return async (pathParams: Record<string, string>) => {
    const path = route.path(pathParams);

    const result = await args.api({
      path: args.baseUrl + path,
      method: route.method,
      headers: args.baseHeaders,
    });

    return { data: result.data, status: result.status };
  };
};

const createNewProxy = (router: AppRouter, args: ClientArgs) => {
  return new Proxy(
    {},
    {
      get: (target, propKey): any => {
        if (typeof propKey === 'string' && propKey in router) {
          const subRouter = router[propKey];

          if (isAppRoute(subRouter)) {
            return getRouteQuery(subRouter, args);
          } else {
            return createNewProxy(subRouter, args);
          }
        }

        return createNewProxy(router, args);
      },
    }
  );
};

type ClientArgs = {
  baseUrl: string;
  baseHeaders: Record<string, string>;
  api: ApiFetcher;
};

export type ApiFetcher = (args: {
  path: string;
  method: string;
  headers: Record<string, string>;
}) => Promise<{
  status: number;
  data: unknown;
}>;

export const initClient = <T extends AppRouter>(
  router: T,
  args: ClientArgs
) => {
  const proxy = createNewProxy(router, args);

  // TODO: See if we can type proxy correctly
  return proxy as RecursiveProxyObj<T>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PathFunction = (arg: any) => string;

type TsCont = {
  router: <T extends AppRouter>(endpoints: T) => T;
  query: <
    T extends {
      method: 'GET' | 'DELETE';
      path: P;
      response: unknown;
    },
    P extends PathFunction
  >(
    query: T
  ) => T;
  mutation: <
    T extends {
      method: 'POST' | 'PUT';
      path: string;
    }
  >(
    mutation: T
  ) => T;
  response: <T>() => T;
  path: <T>() => T;
};

export const initTsCont = (): TsCont => {
  return {
    router: <T extends AppRouter>(args: T) => args,
    query: (args) => args,
    mutation: (args) => args,
    response: <T>() => '' as unknown as T,
    path: <T>() => '' as unknown as T,
  };
};
