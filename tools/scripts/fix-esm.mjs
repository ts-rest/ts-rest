import fs from 'fs/promises';

const libsDist = './dist/libs/ts-rest';
const libs = await fs.readdir(libsDist);

for (const lib of libs) {
  try {
    await fs.access(`${libsDist}/${lib}/index.mjs`);
    console.log(`Skipping ${lib} - already processed...`);
    continue;
  } catch {}

  const packageJson = await fs.readFile(`${libsDist}/${lib}/package.json`, {
    encoding: 'utf-8',
  });

  const newPackageJson = {
    ...JSON.parse(packageJson),
    module: './index.mjs',
    main: './index.js',
    exports: {
      '.': {
        types: './src/index.d.ts',
        import: './index.mjs',
        require: './index.js',
      },
    },
  };

  await fs.writeFile(
    `${libsDist}/${lib}/package.json`,
    JSON.stringify(newPackageJson, null, 2)
  );

  await fs.rename(
    `${libsDist}/${lib}/index.js`,
    `${libsDist}/${lib}/index.mjs`
  );
  await fs.rename(
    `${libsDist}/${lib}/index.cjs`,
    `${libsDist}/${lib}/index.js`
  );
}
