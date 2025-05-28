# Inferring Types

Often, we need to manually extract the request or responses types of specific contract endpoints, so functions, services, lambdas, React components, etc. can be safely typed
when there is no automatic type inference.

We have separate type helpers for server-side and client-side code since we need to infer either the Input or Output Zod types depending on
where the code is used.

## Inferring Response Types

To get the response types of a contract or a specific endpoint, we have the following type helpers:

- `ServerInferResponses<AppRouter | AppRoute, OptionalHttpStatusCode>`
- `ClientInferResponses<AppRouter | AppRoute, OptionalHttpStatusCode>`

```typescript
import { ServerInferResponses } from '@ts-rest/core';
import { contract } from './contract';

type ResponseShapes = ServerInferResponses<typeof contract>;

async function someHttpCall(req: Request): Promise<ResponseShapes['getPosts']> {
  return ...;
}

function someServiceCall(): ServerInferResponses<typeof contract.getPosts> {
  return ...;
}
```

### Inferring Response Body

If you need to infer the response body for a defined response status of a specific endpoint, we can use the following type helpers:

- `ServerInferResponseBody<AppRoute, OptionalHttpStatusCode>`
- `ClientInferResponseBody<AppRoute, OptionalHttpStatusCode>`

This is syntactic sugar for `ServerInferResponses<AppRoute, OptionalHttpStatusCode & keyof AppRoute['responses']>['body']`

```typescript
import React from 'react';
import { ClientInferResponseBody } from '@ts-rest/core';
import { contract } from './contract';

type Post = ClientInferResponseBody<typeof contract.getPost, 200>;

function PostComponent(props: { post: Post }) {
  return <>...</>;
}
```

## Inferring Request Types

To get the request (path params, query params, body) types of a contract or a specific endpoint, we have the following type helpers:

- `ServerInferRequest<AppRouter | AppRoute>`
- `ClientInferRequest<AppRouter | AppRoute>`

```typescript
import { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import { contract } from './contract';

type GetPostRequest = ServerInferRequest<typeof contract.getPost>;
type GetPostResponse = ServerInferResponses<typeof contract.getPost>;

async function getPostLambdaHandler({ params, query }: GetPostRequest): Promise<GetPostResponse> {
  return ...;
}
```
