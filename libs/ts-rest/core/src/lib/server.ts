import { ZodInputOrType } from './type-utils';
import { HTTPStatusCode } from './status-codes';

export type ApiRouteServerResponse<T> =
  | {
      [K in keyof T]: {
        status: K;
        body: ZodInputOrType<T[K]>;
      };
    }[keyof T]
  | {
      status: Exclude<HTTPStatusCode, keyof T>;
      body: unknown;
    };
