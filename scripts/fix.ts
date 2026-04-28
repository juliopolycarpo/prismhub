#!/usr/bin/env bun
/**
 * Runs eslint --fix across all workspaces, then prettier --write on the repo.
 * Returns the first non-zero exit code (so CI surfaces any failure) but always
 * attempts both steps — running prettier after eslint catches any layout
 * shifts eslint might have introduced.
 */
import { bunxCommand, inheritSpawn, runTurboTask } from './_lib/process/spawn';

async function main(): Promise<number> {
  const passthrough = process.argv.slice(2);
  const lintCode = await runTurboTask('lint:fix', passthrough);
  const prettierCode = await inheritSpawn(bunxCommand('prettier', ['.', '--write']));
  return lintCode !== 0 ? lintCode : prettierCode;
}

if (import.meta.main) {
  process.exit(await main());
}
