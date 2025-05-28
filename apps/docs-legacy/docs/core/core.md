# Define Contract

Use the `@ts-rest/core` package to define a contract. Nesting routers can help organize your resources. For example, `/users/:id/posts` could have a nested router `contract.users.posts`. This is the path that you'd use on the client to query the API.

Breaking down the contract to sub-routers also allows you to split up the backend implementation. For example, in Nest.js you could have multiple controllers for the sub-routers.

You can define your contract fields such as `body`, `query`, `pathParams`, and `headers` using a plain TypeScript type through the `c.type` helper, or you can use Zod objects.

```typescript
import { initContract } from '@ts-rest/core';

const c = initContract();
export const contract = c.router({
  createPost: {
    method: 'POST',
    path: '/posts',
    //     ^ Note! This is the full path on the server, not just the sub-path of a route
    responses: {
      201: c.type<Post>(),
    },
    body: z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean().optional(),
      description: z.string().optional(),
    }),
    summary: 'Create a post',
    metadata: { role: 'user' } as const,
  },
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.type<{ posts: Post[]; total: number }>(),
    },
    headers: z.object({
      pagination: z.string().optional(),
    }),
    query: z.object({
      take: z.string().transform(Number).optional(),
      skip: z.string().transform(Number).optional(),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
    metadata: { role: 'guest' } as const,
  },
});
```

## Path Parameters

You can define path parameters by simply adding them to the `path` string with a colon `:` followed by the parameter name.

```typescript
const c = initContract();
export const contract = c.router({
  getPost: {
    ...,
    path: '/api/posts/:id',
  }
});
```

The path parameters will be correctly inferred and included in the `params` object typed as `string` values for requests
on both the client and server.

### Validating and Parsing Path Parameters

If you would like to run validations or transformations/type coercions on the path parameters, you can define a Zod
schema on the `pathParams` field. Note that the parameter names in the `pathParams` schema **must** match the parameter
names in the `path` string.

```typescript
const c = initContract();
export const contract = c.router({
  getPost: {
    ...,
    path: '/api/author/:authorId/posts/:id',
    pathParams: z.object({
      authorId: z.string().nanoid(),
      id: z.coerce.number(),
    }),
  }
});
```

## Query Parameters

Like path parameters, the raw query parameters are always strings, so they must be typed as such in your types or Zod
schema, unless you use transforms or coercions to convert them to other types.

```typescript
const c = initContract();
export const contract = c.router({
  getPosts: {
    ...,
    query: z.object({
      take: z.coerce.number().default(10),
      skip: z.coerce.number().default(0),
      search: z.string().optional(),
    }),
  }
});
```

### JSON Query Parameters

You can also configure ts-rest to encode/decode query parameters as JSON by using the `jsonQuery` option.
This allows you to skip having to do type coercions, and allow you to use complex and typed JSON objects.

```typescript
const c = initContract();
export const contract = c.router({
  getPosts: {
    ...,
    // with `jsonQuery` enabled
    query: z.object({
      take: z.number().default(10),
      skip: z.number().default(0),
      filter: z
        .object({
          by: z.enum(['title', 'author', 'content']),
          search: z.string(),
        })
        .optional(),
    }),
  },
});
```

Check the relevant sections to see how to enable `jsonQuery` on the client or server.

## Headers

You can define headers in your contract, however, they must have an input type of `string`, as they cannot be typed otherwise.
You can use Zod transforms or coercion to transform any string values to different types if needed.

```typescript
const c = initContract();
export const contract = c.router({
  getPosts: {
    ...,
    headers: z.object({
      authorization: z.string(),
      pagination: z.coerce.number().optional(),
    }),
  }
});
```

You can also define base headers for all routes in a contract and its sub-contracts, this is useful for things like
authorization headers. This will force the client to always pass these headers in each request, unless also defined
in the client's `baseHeaders`.

```typescript
const c = initContract();
export const contract = c.router(
  {
    // ...endpoints
  },
  {
    baseHeaders: z.object({
      authorization: z.string(),
    }),
  }
);
```

## Responses

To define your response types, they need to be defined as a map of status codes to response types.

Responses are assumed by default to have a `content-type` of `application/json`, however, you can define other response
types using `c.otherResponse` and passing in the `content-type` header value and body type or Zod schema.

```typescript
const c = initContract();

export const contract = c.router({
  createPost: {
    ...,
    responses: {
      201: z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
        description: z.string(),
      }),
      404: c.type<{ message: string }>(),
      500: c.otherResponse({
        contentType: 'text/plain',
        body: z.literal('Server Error'),
      })
    },
    ...,
  },
});
```

## Combining Contracts

You can combine contracts to create a single contract, helpful if you want many sub-contracts, especially if they are huge.

```typescript
const c = initContract();

export const postContract = c.router({
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.type<{ posts: Post[]; total: number }>(),
    },
    query: z.object({
      take: z.string().transform(Number).optional(),
      skip: z.string().transform(Number).optional(),
      search: z.string().optional(),
    }),
    summary: 'Get all posts',
  },
});

export const contract = c.router({
  posts: postContract,
});
```

## Metadata

You can attach metadata with any type to your contract routes that can be accessed anywhere throughout ts-rest where
you have access to the contract route object.

```typescript
const c = initContract();
export const contract = c.router({
    getPosts: {
        ...,
        metadata: { role: 'guest' } as const,
    }
});
```

:::caution

As the contract is not only used on the server, but on the client as well, it will also be part of your client-side bundle.
You should not put any sensitive information in the metadata.

:::

## Intellisense

For intellisense on your contract types, you can use [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#type).

```typescript
const c = initContract();

export const contract = c.router({
  getPosts: {
    method: 'GET',
    path: '/posts',
    responses: {
      200: c.type<{ posts: Post[]; total: number }>(),
    },
    query: z.object({
      /**
       * @type {string} - UTC timestamp in milliseconds
       */
      beginDate: z.string(),
      /**
       * @type {string} - UTC timestamp in milliseconds
       */
      endDate: z.string(),
    }),
    summary: 'Get posts within time-range',
  },
});
```

## Options

These configuration options allow you to modify how your contract functions.

### Common Responses

APIs often have shared common response schemas, specifically for error responses. You can define these common responses
in the contract options. You can define those using `commonResponses`.

```typescript
const c = initContract();
export const contract = c.router(
  {
    // ...endpoints
  },
  {
    commonResponses: {
      404: c.type<{ message: 'Not Found'; reason: string }>(),
      500: c.otherResponse({
        contentType: 'text/plain',
        body: z.literal('Server Error'),
      }),
    },
  }
);
```

### Strict Response Status Codes

To help with incremental adoption, ts-rest, by default, will allow any response status code to be returned from the server
even if it is not defined in the contract.

As a result, the response types on the client will include all possible HTTP status codes, even ones that are not defined
in the contract with those mapping to a body type of `unknown`.

If you would like to disable this functionality and only allow the response status codes defined in the contract, you can
set the `strictStatusCodes` option to `true` when initializing the contract.

```typescript
const c = initContract();
export const contract = c.router(
  {
    // ...endpoints
  },
  {
    strictStatusCodes: true,
  }
);
```

You can also set this option on a per-route basis which will also override the global option.

```typescript
const c = initContract();
export const contract = c.router({
  getPosts: {
    ...,
    strictStatusCodes: true,
  }
});
```

:::caution

### TL;DR: YOU MUST ENABLE `throwOnUnknownStatus` IN THE FETCH CLIENT WHEN `strictStatusCodes` IS ENABLED

`strictStatusCodes` is mainly used to restrict the server from returning any status codes that are not defined in the
contract. Since the client can still possibly receive unknown status codes returned by frameworks, proxies, CDNs, etc.,
the response types on the client will still include all possible HTTP error status codes, with the `body` typed as `unknown`
for status codes that are undefined in your contract. This behavior is nuanced and inconsistent across the different client
packages.

- Fetch Client: Enabling `strictStatusCodes` will restrict the response types to only the defined status codes.
In order to have the runtime behavior match the TypeScript types, you must also enable `throwOnUnknownStatus` in the fetch client options.
This is not enabled by default when `strictStatusCodes` is enabled because throwing on _any_ response is an unusual flow
when using `fetch`, and doing so might unexpectedly break existing code. We have to make sure that throwing is
intentional and explicitly enabled by the user.
- TanStack Query: Enabling `strictStatusCodes` has no effect on the response types. The `data` object will always be typed
to include 2xx responses defined in the contract, and the `error` object will always include all possible HTTP error codes,
whether defined in the contract or not.

:::

### Base Headers

You can assign `baseHeaders` which will be merged with the contract `headers`. Here's how to set it:

```typescript
const c = initContract();
export const contract = c.router(
  {
    // ...endpoints
  },
  {
    baseHeaders: z.object({
      authorization: z.string(),
    }),
  }
);
```

### Path Prefix

The `pathPrefix` option allows you to add a prefix to paths, allowing more modular and reusable routing logic. This option is applied recursively, allowing the application of prefixes to nested contracts. In addition, when hovering over the contract, the prefixed path will appear at the beginning of the path for ease of use.

Here is an example of how to use the `pathPrefix` option. In this example, the resulting path is `/api/v1/mypath`.

```typescript
const c = initContract();
export const contract = c.router(
  {
    getPost: {
      path: '/mypath',
      //... Your Contract
    },
  },
  {
    pathPrefix: '/api/v1',
  }
);
```

You can also use this feature in nested contracts, as shown below. In this case, the resulting path is `/v1/posts/mypath`, with the `pathPrefix` of the nested contract following the `pathPrefix` of the parent contract.

```typescript
const nestedContract = c.router(
  {
    getPost: {
      path: '/mypath',
      //... Your Contract
    },
  },
  {
    pathPrefix: '/posts',
  }
);

const parentContract = c.router(
  {
    posts: nestedContract,
  },
  {
    pathPrefix: '/v1',
  }
);
```
