#!/usr/bin/env bun
import { runTurboTask } from './_lib/spawn';

if (import.meta.main) {
  const code = await runTurboTask('dev', process.argv.slice(2), ['--parallel']);
  process.exit(code);
}
