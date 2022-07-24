export type AppRoute = {
  method: string;
  path: PathFunction;
  response: unknown;
};

// AppRouter contains either { [string]: AppRouter | AppRoute}
export type AppRouter = {
  [key: string]: AppRouter | AppRoute;
};

export const isAppRoute = (obj: AppRoute | AppRouter): obj is AppRoute => {
  return (obj as AppRoute).method !== undefined;
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
