import { describe, expect, test } from 'bun:test';
import { bunxCommand, turboRunCommand, withoutFlags } from './spawn';

describe('bunxCommand()', () => {
  test('builds a bunx command with passthrough args', () => {
    expect(bunxCommand('prettier', ['.', '--check'])).toEqual([
      process.execPath,
      'x',
      'prettier',
      '.',
      '--check',
    ]);
  });
});

describe('turboRunCommand()', () => {
  test('builds a turbo run command with prefixed and passthrough args', () => {
    expect(turboRunCommand('dev', ['--filter=@prismhub/runtime'], ['--parallel'])).toEqual([
      process.execPath,
      'x',
      'turbo',
      'run',
      'dev',
      '--parallel',
      '--filter=@prismhub/runtime',
    ]);
  });
});

describe('withoutFlags()', () => {
  test('removes only exact flag matches', () => {
    const result = withoutFlags(['--fix', '--filter=fix', 'src'], new Set(['--fix']));

    expect(result).toEqual(['--filter=fix', 'src']);
  });
});
