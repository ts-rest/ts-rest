# Custom Client

By default, not specifying an `api` will use the default `tsRestFetchApi` which uses fetch under the hood.

```typescript
import { initClient } from '@ts-rest/core';
import { contract } from './contract';

const client = initClient(contract, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
  // Uses `tsRestFetchApi` by default
});
```

## Adding a Custom API

If you want a custom api, you can reuse the internal `tsRestFetchApi` to add logging/custom logic to your requests!

```typescript
import { initClient, tsRestFetchApi } from '@ts-rest/core';
import { contract } from './contract';

const client = initClient(contract, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
  api: async (args) => {
    // Add anything you want here!

    return tsRestFetchApi(args);
  },
});
```

### Extra Query Arguments

By default when you make a ts-rest request you can pass in `params`, `query`, `body`, `headers` etc. However, sometimes you may want to pass in extra arguments to your custom api. You can do this by extending the type of the `args` parameter in your custom api.

```typescript
const client = initClient(contract, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
  api: async (args: ApiFetcherArgs & { myCustomArg?: string }) => {
    if (args.myCustomArg) {
      // do something with myCustomArg ✨
    }

    return tsRestFetchApi(args);
  },
});
```

The magical bit, is this is now fully typed and will work with your IDE's autocomplete! 🤯

One note here, any extra args which are provided here but aren't typed correctly - e.g. if you've `@ts-expect-error`'d, **will still be passed to your api**. This is because the `args` parameter is a spread of all the other arguments you pass in to your api.

```typescript
client.getPosts({
  query: { skip: 0, take: 10 },
  myCustomArg: 'hello',
  // ^-- autocomplete will work here, allowing you to extend ts-rest however you want
});
```

:::tip
You can use this to accomplish loads of patterns, such as adding a `cache` argument to your api, or adding a `logger` argument to your api - maybe you want to add an `onUploadProgress` argument to your api to track upload progress? You can do all of this with the `args` parameter!
:::

### Accessing the raw body and content type

Ts-Rest automatically stringifies your `body` input for mutations. You can access the raw body object and content-type like so:

```typescript
const client = initClient(contract, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
  api: async ({ path, method, headers, body, rawBody, contentType }) => {
    // do something with rawBody ✨
    return tsRestFetchApi(args);
  },
});
```

## Using Axios (custom api override)

By default ts-rest ships with an incredibly simple fetch
implementation for data fetching, because fetch requires zero extra
dependencies and works perfectly for most use cases, however,
sometimes you may want to use Axios, or another data fetching strategy, for that
you can pass an `api` attribute to the `initClient` or `initQueryClient`.

:::info
The `credentials` option has no effect when using a custom client. Make sure you handle credentials in your custom client
(e.g., setting `withCredentials` in axios).
:::

**Here's a basic example: **

```typescript
import axios, { Method, AxiosError, AxiosResponse, isAxiosError } from 'axios';
import { initClient } from '@ts-rest/core';
import { contract } from './contract';

const client = initClient(contract, {
  baseUrl: 'http://localhost:3333/api',
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  api: async ({ path, method, headers, body }) => {
    const baseUrl = 'http://localhost:3333/api'; //baseUrl is not available as a param, yet
    try {
      const result = await axios.request({
        method: method as Method,
        url: `${this.baseUrl}/${path}`,
        headers,
        data: body,
      });
      return { status: result.status, body: result.data, headers: result.headers };
    } catch (e: Error | AxiosError | any) {
      if (isAxiosError(e)) {
        const error = e as AxiosError;
        const response = error.response as AxiosResponse;
        return { status: response.status, body: response.data, headers: response.headers };
      }
      throw e;
    }
  },
});
```

Sometimes you need dynamic headers, IE passing in a Bearer token. There are two approaches you can take:

### Instantiate the `client` with the header passed in:

```typescript
import axios, { Method, AxiosError, AxiosResponse, isAxiosError } from 'axios';
import { initClient } from '@ts-rest/core';
import { contract } from './contract';

export class SampleAPI {
  token: string;
  constructor(params: { token: string }) {
    this.token = params.token;
    this.baseUrl = 'http://localhost:3333/api';
  }
  client = () => {
    return initClient(contract, {
      baseUrl: this.baseUrl,
      baseHeaders: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      api: async ({ path, method, headers, body }) => {
        try {
          const result = await axios.request({
            method: method as Method,
            url: `${this.baseUrl}/${path}`,
            headers,
            data: body,
          });
          return { status: result.status, body: result.data, headers: result.headers };
        } catch (e: Error | AxiosError | any) {
          if (isAxiosError(e)) {
            const error = e as AxiosError;
            const response = error.response as AxiosResponse;
            return { status: response.status, body: response.data, headers: response.headers };
          }
          throw e;
        }
      },
    });
  };
}
```

### Instantiate the `client` but access a token during runtime:

Here's an example using the `firebase/auth` library. Because `api` is async, you can `await` various calls when using the method.

```typescript
import axios, { Method, AxiosError, AxiosResponse, isAxiosError } from 'axios';
import { initClient } from '@ts-rest/core';
import { contract } from './contract';

export class SampleAPI {
  authInstance: Auth;
  constructor(params: { authInstance: Auth }) {
    this.authInstance = params.authInstance;
  }
  client = () => {
    return initClient(contract, {
      baseUrl: '',
      baseHeaders: {
        'Content-Type': 'application/json',
      },
      api: async ({ path, method, headers, body }) => {
        const idToken = await this.authInstance.currentUser.getIdToken();
        try {
          const result = await axios.request({
            method: method as Method,
            url: `${this.baseUrl}/${path}`,
            headers: {
              ...headers,
              Authorization: `Bearer ${idToken}`,
            },
            data: body,
          });
          return { status: result.status, body: result.data, headers: result.headers };
        } catch (e: Error | AxiosError | any) {
          if (isAxiosError(e)) {
            const error = e as AxiosError;
            const response = error.response as AxiosResponse;
            return { status: response.status, body: response.data, headers: response.headers };
          }
          throw e;
        }
      },
    });
  };
}
```

:::
