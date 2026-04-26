import { describe, expect, test } from 'bun:test';
import {
  firstFailure,
  getVerifyPlan,
  shouldUseFullCheckOutput,
  VERIFY_PLAN,
  type CommandRunResult,
} from './verify.ts';

describe('getVerifyPlan()', () => {
  test('returns check, build, boundaries in order outside CI', () => {
    const plan = getVerifyPlan({});
    expect(plan.map((c) => c.name)).toEqual(['check', 'build', 'boundaries']);
    expect(plan[0]?.argv).toEqual(['bun', 'run', 'check']);
  });

  test('uses check --full in CI', () => {
    const plan = getVerifyPlan({ CI: 'true' });

    expect(plan[0]?.argv).toEqual(['bun', 'run', 'check', '--full']);
  });

  test('every command shells out to bun run <name>', () => {
    for (const cmd of VERIFY_PLAN) {
      expect(cmd.argv[0]).toBe('bun');
      expect(cmd.argv[1]).toBe('run');
    }
  });
});

describe('shouldUseFullCheckOutput()', () => {
  test('returns true for CI=true', () => {
    expect(shouldUseFullCheckOutput({ CI: 'true' })).toBe(true);
  });

  test('returns false outside CI', () => {
    expect(shouldUseFullCheckOutput({})).toBe(false);
  });
});

describe('firstFailure()', () => {
  test('returns null when every result has exit code 0', () => {
    const results: CommandRunResult[] = [
      { name: 'check', exitCode: 0 },
      { name: 'build', exitCode: 0 },
      { name: 'boundaries', exitCode: 0 },
    ];
    expect(firstFailure(results)).toBeNull();
  });

  test('returns the first non-zero result and ignores later failures', () => {
    const results: CommandRunResult[] = [
      { name: 'check', exitCode: 0 },
      { name: 'build', exitCode: 2 },
      { name: 'boundaries', exitCode: 3 },
    ];
    const failure = firstFailure(results);
    expect(failure?.name).toBe('build');
    expect(failure?.exitCode).toBe(2);
  });

  test('returns null for an empty sequence (nothing to run, nothing to fail)', () => {
    expect(firstFailure([])).toBeNull();
  });
});
