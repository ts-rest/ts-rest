# Eventsource

You can create eventsource endpoints to communicate in realtime with your front-end.

## Route EventSource

In the below example we show how you can add event source for a specific route.

```typescript
import { initServer } from '@ts-rest/express';
import { contract } from './contract';

const s = initServer();

const router = s.router(contract, {
  getEvents: {
    method: 'GET',
    path: `/events`,
    headers: z.object({
      contentType: z.string().default('text/event-stream'), // content-type: 'text/event-stream' is mandatory
    }),
    responses: {
      200: z.any(),
      500: z.any(),
    },
    summary: 'Create EventSource connection',
  },
});

createExpressEndpoints(contract, router, app);
```
