#!/usr/bin/env bun
import { runRuntimeScript } from './_lib/commands/runtime-script';

if (import.meta.main) {
  process.exit(await runRuntimeScript('migrate', process.argv.slice(2)));
}
