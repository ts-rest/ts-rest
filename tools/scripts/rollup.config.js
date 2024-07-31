const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const { logger } = require('@nx/devkit');
const { default: renameExtensions } = require('@betit/rollup-plugin-rename-extensions');

let sortPackageJson;
let builtCompleteFunction;

logger.info = new Proxy(logger.info, {
  apply(target, thisArg, args) {
    target.apply(thisArg, args);

    // nx prints this message after rollup finishes and nx itself has completed building the resulting package.json
    if (args[0].includes('Done in')) {
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
    // STEP 1: Add @ts-rest/core to peerDependencies of all libs, except core itself
    // Can't let changesets handle this for us because it sees peerDependencies updates as a breaking change
    const packageJsonPath = path.join(outputDir, 'package.json');
    const packageJsonObject = fs.readJsonSync(packageJsonPath);
    const splitVersion = packageJsonObject.version.split('.');
    splitVersion.splice(-1, 1, '0');

    const peerVersion = packageJsonObject.version.includes('-')
      ? packageJsonObject.version          // pre-release needs to use exact version
      : `~${splitVersion.join('.')}`;

    packageJsonObject.peerDependencies = {
      ...packageJsonObject.peerDependencies,
      '@ts-rest/core': peerVersion,
    };

    const exportsAndTypesVersions =
      Object.entries(packageJsonObject.exports)
        .reduce((acc, [key, value]) => {
          if (typeof value === 'string') {
            acc.exports.push([key, value]);
            return acc;
          }

          const name = value.module.replace(/\.esm\.js$/, '');

          acc.exports.push([
            key,
            {
              import: `${name}.esm.mjs`,
              require: value.default,
              types: `${name}.cjs.d.ts`
            }
          ]);

          if (key !== '.') {
            acc.typesVersions.push([
              key.replace(/^\.\//, ''),
              [`${name}.cjs.d.ts`]
            ]);
          }

          return acc;
        }, { exports: [], typesVersions: [] });

    if (exportsAndTypesVersions.exports.length > 0) {
      packageJsonObject.exports = Object.fromEntries(exportsAndTypesVersions.exports);
    }

    if (exportsAndTypesVersions.typesVersions.length > 0) {
      packageJsonObject.typesVersions = { '*': Object.fromEntries(exportsAndTypesVersions.typesVersions) };
    }

    if (packageJsonObject.module) {
      packageJsonObject.module = packageJsonObject.module.replace(/\.esm\.js$/, '.esm.mjs');
    }

    fs.writeJsonSync(packageJsonPath, sortPackageJson(packageJsonObject), { spaces: 2 });

    logger.info(
      '\nAdded @ts-rest/core to peer dependencies',
    );

    glob
      .sync([
        path.join(outputDir, '**/*.cjs.default.js'),
        path.join(outputDir, '**/*.cjs.mjs')
      ])
      .forEach((file) => {
        fs.rmSync(file);
      });
  };

  return {
    ...config,
    external: (source, importer, isResolved) => {
      if (source.startsWith('@ts-rest/')) {
        return true;
      }
      return config.external(source, importer, isResolved);
    },
    plugins: [
      ...config.plugins,
      renameExtensions({
        include: [`**/*.ts`, `**/*.tsx`],
        mappings: {
          '.esm.js': '.esm.mjs'
        }
      }),
    ]
  }
}

module.exports = rollupConfig;
