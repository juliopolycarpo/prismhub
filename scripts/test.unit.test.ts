import { describe, expect, test } from 'bun:test';
import { turboRunTestCommand } from './test';

describe('turboRunTestCommand()', () => {
  test('limits Turbo concurrency when requested', () => {
    expect(turboRunTestCommand('test:integration', '1')).toEqual([
      process.execPath,
      'x',
      'turbo',
      'run',
      'test:integration',
      '--concurrency=1',
    ]);
  });

  test('keeps default Turbo scheduling when no concurrency is requested', () => {
    expect(turboRunTestCommand('test:e2e', undefined)).toEqual([
      process.execPath,
      'x',
      'turbo',
      'run',
      'test:e2e',
    ]);
  });
});
