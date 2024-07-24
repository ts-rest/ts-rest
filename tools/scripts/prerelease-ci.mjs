import { exec as execSync } from 'child_process';
import path from 'path';
import url from 'url';
import util from 'util';
import fs from 'fs/promises';

const exec = util.promisify(execSync);

const cwd = path.resolve(
  url.fileURLToPath(new URL('.', import.meta.url)),
  '../../'
);

const execAndOutput = async (command) => {
  console.log('');
  console.log(`\x1b[1m[ts-rest-prerelease] ${command}`);

  const { stdout, stderr } = await exec(command, { cwd });
  console.log(stdout);
  console.error(stderr);
};

const changesetFiles = (
  await fs.readdir(path.resolve(cwd, '.changeset'))
).filter((f) => /^[a-z]+-[a-z]+-[a-z]+\.md$/.test(f));

if (changesetFiles.length === 0) {
  console.error(
    'No changesets found. Please create a changeset before running this script.'
  );
  process.exit(1);
}

// rename all changeset files to *.bak
for (const file of changesetFiles) {
  await fs.rename(path.resolve(cwd, '.changeset', file), path.resolve(cwd, '.changeset', `${file}.bak`));
}

// one by one, bump the version for each changeset
for (const file of changesetFiles) {
  await fs.rename(path.resolve(cwd, '.changeset', `${file}.bak`), path.resolve(cwd, '.changeset', file));
  await execAndOutput(`pnpm changeset version`, { cwd });
}

