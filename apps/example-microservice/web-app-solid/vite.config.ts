import path from 'path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 5005,
  },
  build: {
    outDir: '../../../dist/apps/example-microservice/web-app-solid',
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@ts-rest/core': path.resolve(
        __dirname,
        '../../../libs/ts-rest/core/src/index.ts'
      ),
      '@ts-rest/react-query': path.resolve(
        __dirname,
        '../../../libs/ts-rest/react-query/src/index.ts'
      ),
      '@ts-rest/example-microservice/util-posts-api': path.resolve(
        __dirname,
        '../../../libs/example-microservice/util-posts-api/src/index.ts'
      ),
    },
  },
});
