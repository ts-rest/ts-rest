# Inferring Types

Often, we need to manually extract the request or responses types of specific contract endpoints, so functions, services, lambdas, React components, etc. can be safely typed
when there is no automatic type inference.

We have separate type helpers for server-side and client-side code since we need to infer either the Input or Output Zod types depending on
where the code is used.

## Inferring Response Types

To get the response types of a contract or a specific endpoint, we have the following type helpers:

- `InferResponsesForServer<AppRouter | AppRoute, OptionalHttpStatusCode>`
- `InferResponsesForClient<AppRouter | AppRoute, OptionalHttpStatusCode>`

```typescript
import { InferResponsesForServer } from '@ts-rest/core';
import { contract } from './contract';

type ResponseShapes = InferResponsesForServer<typeof contract>;

async function someHttpCall(req: Request): Promise<ResponseShapes['getPosts']> {
  return ...;
}

function someServiceCall(): InferResponsesForServer<typeof contract.getPosts> {
  return ...;
}
```

### Inferring Response Body

If you need to infer the response body for a defined response status of a specific endpoint, we can use the following type helpers:

- `InferResponseBodyForServer<AppRoute, OptionalHttpStatusCode>`
- `InferResponseBodyForClient<AppRoute, OptionalHttpStatusCode>`

This is syntactic sugar for `InferResponsesForServer<AppRoute, OptionalHttpStatusCode & keyof AppRoute['responses']>['body']`

```typescript
import React from 'react';
import { InferResponseBodyForClient } from '@ts-rest/core';
import { contract } from './contract';

type Post = InferResponseBodyForClient<typeof contract.getPost, 200>;

function PostComponent(props: { post: Post }) {
  return <>...</>;
}
```

## Inferring Request Types

To get the request (path params, query params, body) types of a contract or a specific endpoint, we have the following type helpers:

- `InferRequestForServer<AppRouter | AppRoute>`
- `InferRequestForClient<AppRouter | AppRoute>`

```typescript
import { InferRequestForServer, InferResponsesForServer } from '@ts-rest/core';
import { contract } from './contract';

type GetPostRequest = InferRequestForServer<typeof contract.getPost>;
type GetPostResponse = InferResponsesForServer<typeof contract.getPost>;

async function getPostLambdaHandler({ params, query }: GetPostRequest): Promise<GetPostResponse> {
  return ...;
}
```
