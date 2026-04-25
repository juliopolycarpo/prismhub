#!/usr/bin/env bun
import { parseArgv } from './_lib/argv';
import { bunxCommand, inheritSpawn, withoutFlags } from './_lib/spawn';

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const args = parseArgv(argv);
  const mode = args.flags.has('write') ? '--write' : '--check';
  const passthrough = withoutFlags(argv, new Set(['--write', '--check']));
  const code = await inheritSpawn(bunxCommand('prettier', ['.', mode, ...passthrough]));
  process.exit(code);
}
