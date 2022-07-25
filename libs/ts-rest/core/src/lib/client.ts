import { AppRoute, AppRouter, isAppRoute } from './dsl';

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

export const initClient = <T extends AppRouter>(
  router: T,
  args: ClientArgs
) => {
  const proxy = createNewProxy(router, args);

  // TODO: See if we can type proxy correctly
  return proxy as RecursiveProxyObj<T>;
};
