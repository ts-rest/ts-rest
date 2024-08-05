const fs = require('fs-extra');
const path = require('path');
const { logger } = require('@nx/devkit');

let sortPackageJson;
let builtCompleteFunction;

logger.info = new Proxy(logger.info, {
  apply(target, thisArg, args) {
    target.apply(thisArg, args);

    // nx prints this message after rollup finishes and nx itself has completed building the resulting package.json
    if (args[0].includes('Done in') && builtCompleteFunction) {
      builtCompleteFunction();
    }
  },
});

(async () => {
  sortPackageJson = (await import('sort-package-json')).default;
})();

/** @type {import("rollup").RollupOptionsFunction} */
const rollupConfig = (config) => {
  const outputDir = config.output.dir;

  builtCompleteFunction = () => {
    if (path.basename(outputDir) === 'core') {
      return;
    }

    // STEP 1: Add @ts-rest/core to peerDependencies of all libs, except core itself
    // Can't let changesets handle this for us because it sees peerDependencies updates as a breaking change
    const packageJsonPath = path.join(outputDir, 'package.json');
    const packageJsonObject = fs.readJsonSync(packageJsonPath);
    const splitVersion = packageJsonObject.version.split('.');
    splitVersion.splice(-1, 1, '0');

    const peerVersion = packageJsonObject.version.includes('-')
      ? packageJsonObject.version // pre-release needs to use exact version
      : `~${splitVersion.join('.')}`;

    packageJsonObject.peerDependencies = {
      ...packageJsonObject.peerDependencies,
      '@ts-rest/core': peerVersion,
    };

    fs.writeJsonSync(packageJsonPath, sortPackageJson(packageJsonObject), {
      spaces: 2,
    });

    logger.info('\nAdded @ts-rest/core to peer dependencies');
  };

  return {
    ...config,
    external: (source, importer, isResolved) => {
      // stop rollup from looking for @ts-rest/* because it thinks they're not external since they are not in package.json
      if (source.startsWith('@ts-rest/')) {
        return true;
      }
      return config.external(source, importer, isResolved);
    },
    plugins: [...config.plugins],
  };
};

module.exports = rollupConfig;
