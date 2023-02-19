# Custom Client

:::info
The `credentials` option has no effect when using a custom client. Make sure you handle credentials in your custom client
(e.g., setting `withCredentials` in axios).
:::

## Using Axios (custom api override)

By default ts-rest ships with an incredibly simple fetch 
implementation for data fetching, because fetch requires zero extra
dependencies and works perfectly for most use cases, however, 
sometimes you may want to use Axios, or another data fetching strategy, for that
you can pass a `api` attribute to the `initClient` or `initQueryClient`.

**Here's a basic example: **
```typescript
import { contract } from './some-contract'
import axios, { Method, AxiosError, AxiosResponse, isAxiosError } from 'axios'
const client = initClient(contract, {
  baseUrl: "http://localhost:3333/api",
  baseHeaders: {
    'Content-Type': 'application/json'
  },
  api: async ({ path, method, headers, body }) => {
    const baseUrl = 'http://localhost:3333/api' //baseUrl is not available as a param, yet
    try {
      const result = await axios.request({
        method: method as Method,
        url: `${this.baseUrl}/${path}`,
        headers,
        data: body,
      })
      return { status: result.status, body: result.data }
    } catch (e: Error | AxiosError | any) {
      if (isAxiosError(e)) {
        const error = e as AxiosError
        const response = error.response as AxiosResponse
        return { status: response.status, body: response.data }
      }
    }
    return { status: 500, body: {} }
  },
})
```

Sometimes you need dynamic headers, IE passing in a Bearer token. There are two approaches you can take:

### Instantiate the `client` with the header passed in:

```typescript
export class SampleAPI {
  token: string
  constructor(params: { token: string }) {
    this.token = params.token
    this.baseUrl = 'http://localhost:3333/api'
  }
  client = () => {
    return initClient(userContract, {
      baseUrl: this.baseUrl,
      baseHeaders: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      api: async ({ path, method, headers, body }) => {
        try {
          const result = await axios.request({
            method: method as Method,
            url: `${this.baseUrl}/${path}`,
            headers,
            data: body,
          })
          return { status: result.status, body: result.data }
        } catch (e: Error | AxiosError | any) {
          if (isAxiosError(e)) {
            const error = e as AxiosError
            const response = error.response as AxiosResponse
            return { status: response.status, body: response.data }
          }
        }
        return { status: 500, body: {} }
      },
    })
  }
}
```

### Instantiate the `client` but access a token during runtime:

Here's an example using the `firebase/auth` library. Because `api` is async, you can `await` various calls when using the method. 

```typescript
export class SampleAPI {
  authInstance: Auth
  constructor(params: { authInstance: Auth }) {
    this.authInstance = params.authInstance
  }
  client = () => {
    return initClient(userContract, {
      baseUrl: '',
      baseHeaders: {
        'Content-Type': 'application/json',
      },
      api: async ({ path, method, headers, body }) => {
        const token = await this.authInstance.currentUser.getIdToken()
        try {
          const result = await axios.request({
            method: method as Method,
            url: `${this.serverEnvUrl}/${path}`,
            headers: { 
              ...headers,
              Authorization: `Bearer ${idToken}` 
            },
            data: body,
          })
          return { status: result.status, body: result.data }
        } catch (e: Error | AxiosError | any) {
          if (isAxiosError(e)) {
            const error = e as AxiosError
            const response = error.response as AxiosResponse
            return { status: response.status, body: response.data }
          }
        }
        return { status: 500, body: {} }
      },
    })
  }
}
```

:::


   Authorization: `Bearer ${token}` 