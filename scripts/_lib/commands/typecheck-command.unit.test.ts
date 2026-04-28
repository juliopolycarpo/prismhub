import { describe, expect, test } from 'bun:test';

import { ROOT_SCRIPTS_TSCONFIG, rootScriptsTypecheckCommand } from './typecheck-command';

describe('rootScriptsTypecheckCommand()', () => {
  test('builds the root scripts tsc build command', () => {
    expect(rootScriptsTypecheckCommand()).toEqual([
      process.execPath,
      'x',
      'tsc',
      '-b',
      ROOT_SCRIPTS_TSCONFIG,
    ]);
  });
});
