/** @type {import("rollup").RollupOptionsFunction} */
const rollupConfig = (config) => {
  return {
    ...config,
    external: (source, importer, isResolved) => {
      if (source.startsWith('@ts-rest/')) {
        return true;
      }
      return config.external(source, importer, isResolved);
    },
    plugins: [...config.plugins]
  }
}

module.exports = rollupConfig;

(async() => {
  const fs = require('fs-extra');
  const path = require('path');
  const glob = require('glob');
  const {default: sortPackageJson} = await import('sort-package-json');
  const { logger } = require('@nx/devkit');

  const targetProject = process.env.NX_TASK_TARGET_PROJECT;
  const libsProjectJson = glob.sync('libs/ts-rest/*/project.json', {
    ignore: [
      'libs/ts-rest/core/project.json',
      'libs/ts-rest/react-query-v5/project.json',
    ],
  });

  let targetBuildPath;
  for (const projectJsonPath of libsProjectJson) {
    const projectJson = fs.readJsonSync(projectJsonPath);
    if (projectJson.name === targetProject) {
      targetBuildPath = projectJson.targets.build.options.outputPath;
      break;
    }
  }

  if (targetBuildPath) {
    logger.info = new Proxy(logger.info, {
      apply(target, thisArg, args) {
        target.apply(thisArg, args);

        if (args[0].includes('Done in')) {
          const packageJsonPath = path.join(targetBuildPath, 'package.json');
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
          fs.writeJsonSync(packageJsonPath, sortPackageJson(packageJsonObject), { spaces: 2 });

          logger.info(
            '\nAdded @ts-rest/core to peer dependencies',
          );
        }
      },
    });
  }
})();
