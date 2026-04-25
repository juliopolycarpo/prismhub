#!/usr/bin/env bun
import { parseArgv } from './_lib/argv';
import { runTurboTask, withoutFlags } from './_lib/spawn';

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const args = parseArgv(argv);
  const task = args.flags.has('fix') ? 'lint:fix' : 'lint';
  const code = await runTurboTask(task, withoutFlags(argv, new Set(['--fix'])));
  process.exit(code);
}
