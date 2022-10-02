import * as core from '@actions/core';
import { execSync } from 'child_process';

/**
 * Output an array of affected packages (from NX), used in the CI to decide which projects to deploy
 */
async function run() {
  try {
    // Set from within the CI, see https://github.com/nrwl/last-successful-commit-action
    const customBase = process.env.NX_AFFECTED_BASE
      ? `--base ${process.env.NX_AFFECTED_BASE}`
      : '';

    const affectedOutput = execSync(
      `yarn nx print-affected --select=projects ${customBase}`
    ).toString();

    const lines = affectedOutput.split('\n');
    const affected =
      lines[lines.length - 2]
        .split(',')
        .map((s) => s.trim())
        .filter((x) => x !== '') || [];

    core.notice(`nx_affected = ${JSON.stringify(affected)}`);
    core.setOutput('nx_affected', JSON.stringify(affected));
  } catch (error) {
    core.setFailed(JSON.stringify(error));
  }
}

run();
