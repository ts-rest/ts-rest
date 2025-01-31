import process from 'node:process';
import fastify from 'fastify';
import { blogPlugin } from './routers/blog';

const app = fastify({ logger: true });

app.register(blogPlugin, {
  responseValidation: true,
  logInitialization: true,
});

(async () => {
  try {
    await app.listen({ port: Number(process.env.PORT ?? 3000) });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
})();
