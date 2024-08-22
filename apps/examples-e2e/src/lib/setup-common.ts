import path from 'node:path';
import process from 'node:process';
import concurrently from 'concurrently';
import getPort from 'get-port';
import type { GlobalSetupContext } from 'vitest/node';
import waitOn from 'wait-on';

export const getExampleProjectRoot = (name: string) => {
  return path.join(
    process.env.NX_WORKSPACE_ROOT ?? path.join(process.cwd(), '../..'),
    'examples',
    name
  );
};

export const setupServer = ({
  project,
  env,
  command,
}: {
  project: string;
  env?: Record<string, unknown>;
  command?: string;
}) => {
  let setupDone = false;
  let teardownDone = false;

  const setup = async ({ provide }: GlobalSetupContext) => {
    if (setupDone) {
      return;
    }
    setupDone = true;

    const port = await getPort();
    provide('port', port);

    concurrently(
      [
        {
          cwd: getExampleProjectRoot(path.basename(path.dirname(project))),
          env: {
            PORT: port,
            ...env,
          },
          command: command ?? 'pnpm run start:prod',
        },
      ],
      {
        killOthers: ['failure', 'success'],
      }
    );

    await waitOn({
      resources: [`tcp:127.0.0.1:${port}`],
    });
  };

  const teardown = async () => {
    if (teardownDone) {
      return;
    }
    teardownDone = true;

    process.emit('SIGINT');
  };

  return { setup, teardown };
};

declare module 'vitest' {
  export interface ProvidedContext {
    port: number;
  }
}
