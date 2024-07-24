/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';

console.log(
  path.resolve(__dirname, '../../../libs/ts-rest/react-query-v5/src/v5.ts'),
);

export default defineConfig({
  cacheDir: '../../../node_modules/.vite/example-microservice-web-app',

  plugins: [
    viteTsConfigPaths({
      root: '../../../',
    }),
  ],
  server: {
    port: 5004,
  },
  resolve: {
    alias: {
      '@ts-rest/core': path.resolve(
        __dirname,
        '../../../libs/ts-rest/core/src/index.ts',
      ),
      '@ts-rest/react-query/v5': path.resolve(
        __dirname,
        '../../../libs/ts-rest/react-query-v5/src/v5/index.ts',
      ),
      '@ts-rest/example-microservice/util-posts-api': path.resolve(
        __dirname,
        '../../../libs/example-microservice/util-posts-api/src/index.ts',
      ),
    },
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../../',
  //    }),
  //  ],
  // },

  test: {
    globals: true,
    cache: {
      dir: '../../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
