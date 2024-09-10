// from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d76cf253c9e9d5cab5de498e18186b9170ae0877/types/node/v20/globals.d.ts
export {};

type _Request = typeof globalThis extends { onmessage: any }
  ? {}
  : import('undici-types').Request;
type _Response = typeof globalThis extends { onmessage: any }
  ? {}
  : import('undici-types').Response;
type _FormData = typeof globalThis extends { onmessage: any }
  ? {}
  : import('undici-types').FormData;
type _Headers = typeof globalThis extends { onmessage: any }
  ? {}
  : import('undici-types').Headers;
type _RequestInit = typeof globalThis extends { onmessage: any }
  ? {}
  : import('undici-types').RequestInit;
type _ResponseInit = typeof globalThis extends { onmessage: any }
  ? {}
  : import('undici-types').ResponseInit;
type _File = typeof globalThis extends { onmessage: any }
  ? {}
  : import('node:buffer').File;

// #region borrowed
// from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d76cf253c9e9d5cab5de498e18186b9170ae0877/types/node/v20/url.d.ts
type _URLSearchParams = typeof globalThis extends { onmessage: any }
  ? {}
  : import('node:url').URLSearchParams;
// #endregion borrowed

declare global {
  // #region borrowed
  // from https://github.com/microsoft/TypeScript/blob/38da7c600c83e7b31193a62495239a0fe478cb67/lib/lib.webworker.d.ts#L633 until moved to separate lib
  /** A controller object that allows you to abort one or more DOM requests as and when desired. */
  interface AbortController {
    /**
     * Returns the AbortSignal object associated with this object.
     */

    readonly signal: AbortSignal;
    /**
     * Invoking this method will set this object's AbortSignal's aborted flag and signal to any observers that the associated activity is to be aborted.
     */
    abort(reason?: any): void;
  }

  /** A signal object that allows you to communicate with a DOM request (such as a Fetch) and abort it if required via an AbortController object. */
  interface AbortSignal extends EventTarget {
    /**
     * Returns true if this AbortSignal's AbortController has signaled to abort, and false otherwise.
     */
    readonly aborted: boolean;
    readonly reason: any;
    onabort: null | ((this: AbortSignal, event: Event) => any);
    throwIfAborted(): void;
  }

  var AbortController: typeof globalThis extends {
    onmessage: any;
    AbortController: infer T;
  }
    ? T
    : {
        prototype: AbortController;
        new (): AbortController;
      };

  var AbortSignal: typeof globalThis extends {
    onmessage: any;
    AbortSignal: infer T;
  }
    ? T
    : {
        prototype: AbortSignal;
        new (): AbortSignal;
        abort(reason?: any): AbortSignal;
        timeout(milliseconds: number): AbortSignal;
        any(signals: AbortSignal[]): AbortSignal;
      };
  // #endregion borrowed

  interface RequestInit extends _RequestInit {}

  function fetch(
    input: string | URL | globalThis.Request,
    init?: RequestInit,
  ): Promise<Response>;

  interface Request extends _Request {}
  var Request: typeof globalThis extends {
    onmessage: any;
    Request: infer T;
  }
    ? T
    : typeof import('undici-types').Request;

  interface ResponseInit extends _ResponseInit {}

  interface Response extends _Response {}
  var Response: typeof globalThis extends {
    onmessage: any;
    Response: infer T;
  }
    ? T
    : typeof import('undici-types').Response;

  interface FormData extends _FormData {}
  var FormData: typeof globalThis extends {
    onmessage: any;
    FormData: infer T;
  }
    ? T
    : typeof import('undici-types').FormData;

  interface Headers extends _Headers {}
  var Headers: typeof globalThis extends {
    onmessage: any;
    Headers: infer T;
  }
    ? T
    : typeof import('undici-types').Headers;

  interface File extends _File {}
  var File: typeof globalThis extends {
    onmessage: any;
    File: infer T;
  }
    ? T
    : typeof import('node:buffer').File;

  // #region borrowed
  // from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d76cf253c9e9d5cab5de498e18186b9170ae0877/types/node/v20/url.d.ts
  interface URLSearchParams extends _URLSearchParams {}

  var URLSearchParams: typeof globalThis extends {
    onmessage: any;
    URLSearchParams: infer T;
  }
    ? T
    : typeof import('node:url').URLSearchParams;
  // #endregion borrowed
}
