# EventSource

You can create EventSource endpoints to communicate in real-time with your front-end.
This section explains how to use EventSource endpoints with `ts-rest/express` for back-end servers.

## Route EventSource

In the example below, we demonstrate how to add an EventSource for a specific route.

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

The behavior of an EventSource is different from a normal request. The response is a stream of events.
As a result, you cannot return a response body if you want to keep your EventSource connection alive.
In this example, getEvents returns undefined.

> **Note**: When using `ts-rest/express`, the `Content-Type` header for EventSource endpoints is automatically set to `text/event-stream`. You do not need to define it manually. `Cache-Control` header is set to `no-cache`. `Connection` header is set to `keep-alive`.

Below is an example of a controller:

```typescript
import objectHash from 'object-hash';
import { errorResponseHandler } from '../helpers';
import { sse } from '../server';

export const getEvents = async ({ req, res }) => {
  try {
    // req.user is created by the auth middleware.
    // Alternatively, you can use a session ID.
    const userId = objectHash.sha1(req.user);

    sse.attach(userId, res);
  } catch (error) {
    return errorResponseHandler(error);
  }
};
```

## SSE Manager

`sse` is an EventSource manager. Below is a simplified example of an `SSE` class that manages EventSource connections. 
The `send` method broadcasts an event to all connected clients. Improve it if you want by adding additional features like error handling, send a specific event to a specific client, get open connections, etc.

```typescript
export class SSE extends EventEmitter {
  private connections = new Map<string, SSEConnection>();
  private readonly maxConnections: number;
  private readonly connectionTimeout: number;
  private uid = 0; // Unique ID for events

  constructor(options: { connections?: number; connectionTimeout?: number } = {}) {
    super();
    this.maxConnections = options.connections ?? Infinity;
    this.connectionTimeout = options.connectionTimeout ?? 30000; // Default timeout: 30 seconds
  }

  public send = (event = 'message', data: unknown) => {
    if (typeof data === 'undefined') return;
    const msg = `id: ${++this.uid}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.connections.forEach(({ res }) => {
      try {
        res.write(msg);
      } catch (error) {
        console.error('Error sending event:', error);
      }
    });
  };

  public attach = (id: string, res: Response) => {
    if (this.connections.size >= this.maxConnections) {
      throw new Error('Too many connections.');
    }

    const timeout = setTimeout(() => {
      res.end();
      this.connections.delete(id);
    }, this.connectionTimeout);

    this.connections.set(id, { res, timeout });

    res.on('close', () => {
      clearTimeout(timeout);
      this.connections.delete(id);
    });
  };
}

export const createSSE = (options?: { connections?: number; connectionTimeout?: number }) => new SSE(options);
```

> **Note**: The `attach` method ensures the connection remains open and manage timeouts.

## Usage in Main File

In your main file, initialize the `SSE` manager and integrate it with your application:

```typescript
import express from 'express';
import { createServer } from 'http';
import { createSSE } from './sse';

export const app = express();
export const server = createServer(app);
export const sse = createSSE({
  connections: 100, // Maximum 100 concurrent connections
  connectionTimeout: 60000, // 1-minute timeout
});
```

## Sending Events

To send an event to all connected clients, use the `send` method:

```typescript
import { sse } from '../server';

sse.send('message', {
  id: '1',
  message: 'Hello, world!',
});
```

This will broadcast the event with the specified data to all connected clients.
