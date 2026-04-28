import { describe, expect, test } from 'bun:test';
import { runtimeCommand } from './runtime-command';

describe('runtimeCommand()', () => {
  test('builds the root start command against the runtime entrypoint', () => {
    expect(runtimeCommand('serve')).toEqual([
      process.execPath,
      'apps/runtime/src/main.ts',
      'serve',
    ]);
  });

  test('forwards extra argv to runtime subcommands', () => {
    expect(runtimeCommand('migrate', ['--dry-run'])).toEqual([
      process.execPath,
      'apps/runtime/src/main.ts',
      'migrate',
      '--dry-run',
    ]);
  });
});
