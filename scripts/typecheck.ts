#!/usr/bin/env bun
import { bunxCommand, inheritSpawn, runTurboTask } from './_lib/spawn';

async function main(): Promise<number> {
  const passthrough = process.argv.slice(2);
  const turbo = await runTurboTask('typecheck', passthrough);
  if (turbo !== 0) return turbo;
  return inheritSpawn(bunxCommand('tsc', ['--noEmit', '-p', 'scripts/tsconfig.json']));
}

if (import.meta.main) {
  process.exit(await main());
}
