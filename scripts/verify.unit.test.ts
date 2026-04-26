import { describe, expect, test } from 'bun:test';
import { firstFailure, getVerifyPlan, VERIFY_PLAN, type CommandRunResult } from './verify.ts';

describe('getVerifyPlan()', () => {
  test('returns build, check, boundaries in that order', () => {
    const plan = getVerifyPlan();
    expect(plan.map((c) => c.name)).toEqual(['build', 'check', 'boundaries']);
  });

  test('uses plain `bun run check` (no --full) regardless of CI', () => {
    const plan = getVerifyPlan();
    const check = plan.find((c) => c.name === 'check');
    expect(check?.argv).toEqual(['bun', 'run', 'check']);
  });

  test('every command shells out to bun run <name>', () => {
    for (const cmd of VERIFY_PLAN) {
      expect(cmd.argv[0]).toBe('bun');
      expect(cmd.argv[1]).toBe('run');
    }
  });
});

describe('firstFailure()', () => {
  test('returns null when every result has exit code 0', () => {
    const results: CommandRunResult[] = [
      { name: 'build', exitCode: 0 },
      { name: 'check', exitCode: 0 },
      { name: 'boundaries', exitCode: 0 },
    ];
    expect(firstFailure(results)).toBeNull();
  });

  test('returns the first non-zero result and ignores later failures', () => {
    const results: CommandRunResult[] = [
      { name: 'build', exitCode: 0 },
      { name: 'check', exitCode: 2 },
      { name: 'boundaries', exitCode: 3 },
    ];
    const failure = firstFailure(results);
    expect(failure?.name).toBe('check');
    expect(failure?.exitCode).toBe(2);
  });

  test('returns null for an empty sequence (nothing to run, nothing to fail)', () => {
    expect(firstFailure([])).toBeNull();
  });
});
