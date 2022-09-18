import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5004,
  },
  build: {
    outDir: '../../../dist/apps/example-microservice/web-app',
  },
});
