import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5006,
  },
  build: {
    outDir: '../../../dist/apps/example-microservice/web-app-vue',
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@ts-rest/core': path.resolve(
        __dirname,
        '../../../libs/ts-rest/core/src/index.ts'
      ),
      '@ts-rest/vue-query': path.resolve(
        __dirname,
        '../../../libs/ts-rest/vue-query/src/index.ts'
      ),
      '@ts-rest/example-microservice/util-posts-api': path.resolve(
        __dirname,
        '../../../libs/example-microservice/util-posts-api/src/index.ts'
      ),
    },
  },
});
