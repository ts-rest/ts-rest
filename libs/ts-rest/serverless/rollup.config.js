const defaultRollupConfig = require('../../../tools/scripts/rollup.config');

/**
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @type RollupOptions
 * @param {RollupOptions} config
 */

const rollupConfig = (config) => {
  return {
    ...defaultRollupConfig(config),
    input: [
      config.input,
      'libs/ts-rest/serverless/src/fetch.ts',
      'libs/ts-rest/serverless/src/aws.ts',
      'libs/ts-rest/serverless/src/next-edge.ts',
    ],
  };
};

module.exports = rollupConfig;
