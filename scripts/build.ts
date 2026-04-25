#!/usr/bin/env bun
import { runTurboTask } from './_lib/spawn';

if (import.meta.main) {
  const code = await runTurboTask('build', process.argv.slice(2));
  process.exit(code);
}
