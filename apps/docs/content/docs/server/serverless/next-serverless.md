---
title: 'Next.js Edge Runtime & App Router'
description: How to use ts-rest with Next.js Edge Runtime & App Router
---

The Next handler can be used for the Pages Router Edge Runtime or for the App Router.

The handler file needs to be a catch-all route file, which is a file that matches the pattern `[...ts-rest]` pattern.
In the case of the Pages Router, it must be named exactly `[...ts-rest].ts`.

```typescript
// App router: /app/[...ts-rest]/route.ts
// Pages router: /pages/api/[...ts-rest].ts

import { createNextHandler } from '@ts-rest/serverless/next';
import { contract } from './contract';
import { router } from './router';

export const handler = createNextHandler(contract, router, {
  handlerType: 'app-router',
  // handlerType: 'pages-router-edge',

  // rest of options
});
```

## Example Usage

- [App Router](https://github.com/ts-rest/ts-rest/blob/main/apps/example-next/app/api/app-router/%5B...ts-rest%5D/route.ts)
- [Pages Router Edge](https://github.com/ts-rest/ts-rest/blob/main/apps/example-next/pages/api/edge/%5B...ts-rest%5D.ts)

## Context Object

In addition to the regular context properties, the context object for Next handlers includes the following additional properties:

- `nextRequest: NextRequest`: The Next.js specific request object.

```typescript
import { createNextHandler } from '@ts-rest/serverless/next';
import { contract } from './contract';

export const handler = createNextHandler(contract, {
  getPost: async ({ params: { id } }, { nextRequest, responseHeaders }) => {
    responseHeaders.set('x-geo-country', nextRequest.geo.country);

    return {
      status: 200,
      body: {
        id,
        title: 'Hello, World!',
      },
    };
  },
});
```
