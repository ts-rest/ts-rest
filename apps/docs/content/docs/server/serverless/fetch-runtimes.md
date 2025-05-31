---
title: 'Fetch Runtimes'
description: How to use ts-rest with Fetch Runtimes
---

The default `@ts-rest/serverless/fetch` handler is able to handle and route requests for any runtime that follows the [WinterCG](https://wintercg.org/) [Minimum Common Web Platform API](https://common-min-api.proposal.wintercg.org/).

This includes but is not limited to:

- Cloudflare Workers
- Netlify Functions
- Vercel Functions

## Platform Context

Some platforms provide additional context arguments that you may want to pass to your handler functions.
You need to first instantiate a router object with the correct context type, and then pass it with that type to the `fetchRequestHandler` function.

```typescript
import { fetchRequestHandler, tsr } from '@ts-rest/serverless/fetch';
import { contract } from './contract';

export const router = tsr.platformContext<{ customContext: PlatformContext }>().router(contract, {
  getPost: async ({ params: { id } }, { customContext }) => {
    console.log(platformContext);
    return {
      status: 200,
      body: {
        id: id,
        title: 'Hello, World!',
      },
    };
  },
});
```

## Handler Examples

### Cloudflare Workers

```typescript
import type { Request as WorkerRequest, ExecutionContext, KVNamespace } from '@cloudflare/workers-types/experimental';
import { fetchRequestHandler, tsr } from '@ts-rest/serverless/fetch';
import { contract } from './contract';

interface Env {
  MY_KV_NAMESPACE: KVNamespace;
}

const router = tsr
  .platformContext<{
    workerRequest: WorkerRequest;
    workerEnv: Env;
    workerContext: ExecutionContext;
  }>()
  .router(contract, {
    getPost: async ({ params: { id } }, { workerRequest, workerEnv, workerContext }) => {
      return {
        status: 200,
        body: {
          id: id,
          title: await workerEnv.MY_KV_NAMESPACE.get(`post_${id}`),
          country: workerRequest.cf?.country,
        },
      };
    },
  });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return fetchRequestHandler({
      request,
      contract,
      router,
      platformContext: {
        workerRequest: request as unknown as WorkerRequest,
        workerEnv: env,
        workerContext: ctx,
      },
    });
  },
};
```

### Netlify Functions

```typescript
import type { Context } from '@netlify/functions';
import { fetchRequestHandler, tsr } from '@ts-rest/serverless/fetch';
import { contract } from './contract';

const router = tsr.platformContext<{ netlifyContext: Context }>().router(contract, {
  getPost: async ({ params: { id } }, { netlifyContext }) => {
    return {
      status: 200,
      body: {
        id: id,
        title: 'Hello, World!',
        ip: netlifyContext.ip,
      },
    };
  },
});

export default async (request: Request, netlifyContext: Context) => {
  return fetchRequestHandler({
    request,
    contract,
    router,
    platformContext: {
      netlifyContext,
    },
  });
};
```

### Vercel Functions

```typescript
import type { RequestContext } from '@vercel/edge';
import { fetchRequestHandler, tsr } from '@ts-rest/serverless/fetch';
import { contract } from './contract';

const router = tsr.platformContext<{ vercelContext: RequestContext }>().router(contract, {
  getPost: async ({ params: { id } }, { vercelContext }) => {
    return {
      status: 200,
      body: {
        id: id,
        title: 'Hello, World!',
      },
    };
  },
});

const handler = async (request: Request, vercelContext: RequestContext) => {
  return fetchRequestHandler({
    request,
    contract,
    router,
    platformContext: {
      vercelContext,
    },
  });
};

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
```
