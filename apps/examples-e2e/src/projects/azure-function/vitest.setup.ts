import { setupServer } from '../../lib/setup-common.js';

const { setup, teardown } = setupServer({
  project: import.meta.url,
});

export { setup, teardown };
