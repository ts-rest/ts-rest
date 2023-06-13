import fs from 'fs/promises';

const libsDist = './dist/libs/ts-rest';
const libs = await fs.readdir(libsDist);

for (const lib of libs) {
  const libDir = `${libsDist}/${lib}`;

  try {
    await fs.access(`${libDir}/index.mjs`);
    console.log(`Skipping ${lib} - already processed...`);
    continue;
  } catch {}

  const packageJson = JSON.parse(await fs.readFile(`${libDir}/package.json`, {
    encoding: 'utf-8',
  }));

  const newPackageJson = {
    ...packageJson,
    module: './index.mjs',
    main: './index.js',
    // Ensure that esm is not forced due to "type": "module" being added.
    type: undefined,
    exports: Object.fromEntries(
      Object.entries(packageJson.exports).map(([key, value]) => {
        return [
          key,
          {
            ...value,
            import: value.import.replace('.js', '.mjs'),
            require: value.require.replace('.cjs', '.js'),
          },
        ];
      })
    ),
  };

  await fs.writeFile(
    `${libDir}/package.json`,
    JSON.stringify(newPackageJson, null, 2)
  );

  const libFiles = await fs.readdir(libDir);

  for (const libFile of libFiles) {
    if (libFile.endsWith('.js')) {
      await fs.rename(
        `${libDir}/${libFile}`,
        `${libDir}/${libFile}`.replace('.js', '.mjs')
      );
    }
  }

  for (const libFile of libFiles) {
    if (libFile.endsWith('.cjs')) {
      await fs.rename(
        `${libDir}/${libFile}`,
        `${libDir}/${libFile}`.replace('.cjs', '.js'),
      );
    }
  }
}
