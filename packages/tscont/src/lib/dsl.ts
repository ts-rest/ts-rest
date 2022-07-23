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
  ? () => { data: TRoute['response'] }
  : (path: Parameters<TRoute['path']>[0]) => { data: TRoute['response'] };

export const initClient = <T>(args: {
  baseUrl: string;
  baseHeaders: Record<string, string>;
}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const proxyObj: RecursiveProxyObj<T> = {} as unknown;

  return new Proxy(proxyObj, {
    get: (target, propKey) => {
      console.log('query', args, target, propKey);
    },
  });
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
    response: <T>() => '' as T,
    path: <T>() => '' as T,
  };
};
