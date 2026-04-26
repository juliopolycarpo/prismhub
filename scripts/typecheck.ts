#!/usr/bin/env bun
import { bunxCommand, inheritSpawn, runTurboTask } from './_lib/spawn';

async function main(): Promise<number> {
  const passthrough = process.argv.slice(2);
  const [turbo, scripts] = await Promise.all([
    runTurboTask('typecheck', passthrough),
    inheritSpawn(bunxCommand('tsc', ['-b', 'scripts/tsconfig.json'])),
  ]);
  return turbo === 0 && scripts === 0 ? 0 : turbo || scripts;
}

if (import.meta.main) {
  process.exit(await main());
}
