#!/usr/bin/env bun
import { inheritSpawn, runTurboTask } from './_lib/process/spawn';
import { rootScriptsTypecheckCommand } from './_lib/commands/typecheck-command';

async function main(): Promise<number> {
  const passthrough = process.argv.slice(2);
  const [turbo, scripts] = await Promise.all([
    runTurboTask('typecheck', passthrough),
    inheritSpawn(rootScriptsTypecheckCommand()),
  ]);
  return turbo === 0 && scripts === 0 ? 0 : turbo || scripts;
}

if (import.meta.main) {
  process.exit(await main());
}
