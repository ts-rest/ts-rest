import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    message: 'Hello World!',
  });
});

serve({
  fetch: app.fetch,
  port: 3004,
});
