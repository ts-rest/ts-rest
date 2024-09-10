import { loadEnv } from 'vite';
import { type UserWorkspaceConfig, defineWorkspace } from 'vitest/config';
import { getExampleProjectRoot } from './src/lib/setup-common';

type ProjectConfig = Parameters<typeof defineWorkspace>[0][number];

const defineProject = (
  name: string,
  config?: UserWorkspaceConfig['test']
): ProjectConfig => ({
  test: {
    name,
    root: `./src/projects/${name}`,
    globals: true,
    globalSetup: ['./vitest.setup.ts'],
    ...config,
  },
});

export default defineWorkspace([
  defineProject('azure-function'),
  defineProject('cloudflare-worker'),
  defineProject('express', {
    env: loadEnv('test', getExampleProjectRoot('express'), ''),
  }),
  defineProject('fastify'),
  defineProject('nest-9'),
  defineProject('nest-10'),
  defineProject('nest-multi-handler'),
  defineProject('next-app-dir'),
  defineProject('next-pages-dir'),
]);
