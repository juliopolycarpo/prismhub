import { describe, expect, test } from 'bun:test';
import { runGate, type Gate } from './gate';

const BASE_OPTS = {
  repoRoot: process.cwd(),
  env: { TZ: 'UTC' },
};

describe('runGate()', () => {
  test('resolved gate passes with duration', async () => {
    const gate: Gate = {
      name: 'noop',
      async run() {
        return {
          passed: true,
          passedLabel: 'noop ok',
          failedLabel: 'noop failed',
          output: 'ran',
        };
      },
    };

    const result = await runGate(gate, { ...BASE_OPTS, timeoutMs: 1000 });
    expect(result.passed).toBe(true);
    expect(result.timedOut).toBe(false);
    expect(result.passedLabel).toBe('noop ok');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('thrown error becomes failed result', async () => {
    const gate: Gate = {
      name: 'bad',
      async run() {
        throw new Error('boom');
      },
    };

    const result = await runGate(gate, { ...BASE_OPTS, timeoutMs: 1000 });
    expect(result.passed).toBe(false);
    expect(result.timedOut).toBe(false);
    expect(result.failedLabel).toContain('bad crashed');
    expect(result.failedLabel).toContain('boom');
  });

  test('long-running gate times out', async () => {
    const gate: Gate = {
      name: 'slow',
      async run(ctx) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 5000);
          ctx.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(ctx.signal.reason ?? new Error('aborted'));
          });
        });
        return {
          passed: true,
          passedLabel: 'done',
          failedLabel: 'never',
          output: '',
        };
      },
    };

    const result = await runGate(gate, { ...BASE_OPTS, timeoutMs: 50 });
    expect(result.passed).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.failedLabel).toContain('timed out');
  });
});
