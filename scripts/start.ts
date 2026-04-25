#!/usr/bin/env bun
import { runtimeCommand } from './_lib/runtime-command';
import { inheritSpawn } from './_lib/spawn';

if (import.meta.main) {
  const code = await inheritSpawn(runtimeCommand('serve', process.argv.slice(2)));
  process.exit(code);
}
