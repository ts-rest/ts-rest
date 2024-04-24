import { exec as execSync } from 'child_process';
import path from 'path';
import url from 'url';
import util from 'util';
import fs from 'fs/promises';
import { Command } from 'commander';

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

const program = new Command();

program
  .name('ts-rest-prerelease')
  .description('CLI to help with publishing prereleases');

program
  .requiredOption('--tag <tag>', 'tag to use for prerelease')
  .requiredOption('--branch <branch>', 'branch name to use for the prerelease');

program.parse();

const options = program.opts();

await execAndOutput(`git branch -f prerelease/${options.branch}`, { cwd });
await execAndOutput(`git checkout prerelease/${options.branch}`, { cwd });
await execAndOutput(`pnpm changeset pre enter ${options.tag}`, { cwd });
await execAndOutput(`pnpm changeset version`, { cwd });
await execAndOutput(`pnpm install --no-frozen-lockfile`, { cwd });
await execAndOutput(`git add --all`, { cwd });
