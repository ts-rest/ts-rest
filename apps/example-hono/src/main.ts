import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono! 2');
});

console.log('Listening on port 3004...');

serve({
  fetch: app.fetch,
  port: 3004,
});
