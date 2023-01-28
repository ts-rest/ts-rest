const cleanup = require('rollup-plugin-cleanup');

/**
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @type RollupOptions
 * @param {RollupOptions} config
 */

const rollupConfig = (config) => {
  const newConfig = {
    ...config,
    plugins: [...config.plugins, cleanup({
      extensions: ['ts', 'tsx', 'js', 'jsx'],
    })]
  };
  return newConfig
}

module.exports = rollupConfig