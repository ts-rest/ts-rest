import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5004,
  },
  build: {
    outDir: '../../../dist/apps/example-microservice/web-app',
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
