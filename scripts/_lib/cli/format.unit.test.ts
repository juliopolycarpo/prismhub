import { describe, expect, test } from 'bun:test';
import {
  renderChecklist,
  renderFailures,
  renderFooter,
  renderFullOutput,
  renderGitHubGroup,
} from './format';

describe('renderChecklist()', () => {
  test('marks passed and failed', () => {
    const text = renderChecklist([
      { passed: true, label: 'Typecheck passes across all workspaces' },
      { passed: false, label: '!7/8 integration tests passed' },
    ]);

    expect(text).toBe(
      ['[x] Typecheck passes across all workspaces', '[ ] !7/8 integration tests passed'].join(
        '\n',
      ),
    );
  });

  test('empty input returns empty string', () => {
    expect(renderChecklist([])).toBe('');
  });
});

describe('renderFailures()', () => {
  test('no failures returns empty string', () => {
    expect(renderFailures([])).toBe('');
  });

  test('emits header and named block', () => {
    const text = renderFailures([
      { name: 'integration tests', output: 'FAIL foo.test.ts\n  expected 1, got 2' },
    ]);

    expect(text).toContain('Above failed:');
    expect(text).toContain('▸ integration tests');
    expect(text).toContain('FAIL foo.test.ts');
    expect(text).toContain('expected 1, got 2');
  });
});

describe('renderFullOutput()', () => {
  test('produces one section per block', () => {
    const text = renderFullOutput([
      { name: 'typecheck', output: 'tsc ok' },
      { name: 'lint', output: 'eslint ok' },
    ]);
    expect(text).toContain('typecheck');
    expect(text).toContain('tsc ok');
    expect(text).toContain('lint');
    expect(text).toContain('eslint ok');
  });
});

describe('renderFooter()', () => {
  test.each([
    {
      passedGates: 7,
      totalGates: 7,
      elapsedMs: 3200,
      mode: 'resume',
      expectedContains: ['7 of 7 gates passed', '3.2s total'],
      expectedNotContains: [],
    },
    {
      passedGates: 5,
      totalGates: 7,
      elapsedMs: 1000,
      mode: 'resume',
      expectedContains: ['2 of 7 gates failed', '--full'],
      expectedNotContains: [],
    },
    {
      passedGates: 6,
      totalGates: 7,
      elapsedMs: 1000,
      mode: 'full',
      expectedContains: ['1 of 7 gates failed'],
      expectedNotContains: ['--full'],
    },
  ])(
    'reports $mode mode correctly',
    ({ passedGates, totalGates, elapsedMs, mode, expectedContains, expectedNotContains }) => {
      const text = renderFooter({ totalGates, passedGates, elapsedMs, mode });
      for (const str of expectedContains) expect(text).toContain(str);
      for (const str of expectedNotContains) expect(text).not.toContain(str);
    },
  );
});
describe('renderGitHubGroup()', () => {
  test('wraps body when enabled', () => {
    const out = renderGitHubGroup('typecheck', 'tsc ok\n', true);
    expect(out).toBe('::group::typecheck\ntsc ok\n::endgroup::');
  });

  test('returns plain trimmed body when disabled', () => {
    const out = renderGitHubGroup('typecheck', 'tsc ok\n\n\n', false);
    expect(out).toBe('tsc ok');
    expect(out).not.toContain('::group::');
  });
});
