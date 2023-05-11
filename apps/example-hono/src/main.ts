import { serve } from '@hono/node-server';
import { app } from './server';

serve({
  fetch: app.fetch,
  port: 3004,
});
