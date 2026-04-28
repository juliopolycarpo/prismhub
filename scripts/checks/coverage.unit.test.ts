import { describe, expect, test } from 'bun:test';
import {
  decideCoverageRun,
  LAYER_THRESHOLDS,
  parseCoverageOutput,
  parsePackageSrcCoverage,
  type CoverageRunResult,
} from './coverage';

function makeRun(partial: Partial<CoverageRunResult>): CoverageRunResult {
  return {
    label: 'test',
    exitCode: 0,
    output: '',
    coverage: 100,
    ...partial,
  };
}

describe('parseCoverageOutput()', () => {
  test.each([
    {
      input: [
        'File          | % Funcs | % Lines | Uncovered Line #s',
        '--------------|---------|---------|------------------',
        'All files     |   90.00 |   82.50 |',
      ].join('\n'),
      expected: 82.5,
    },
    { input: '✓ some test\nbun test v1.3.12\n', expected: null },
    { input: '', expected: null },
    { input: 'bun test v1.3.12\n✓ passes\n✓ more\n', expected: null },
    { input: 'All files | 100.00 | 100.00 | ', expected: 100 },
    { input: 'All files |   0.00 |   0.00 | ', expected: 0 },
    { input: '  All files  |  72.34  |  71.00  |', expected: 71 },
  ])('extracts coverage $expected', ({ input, expected }) => {
    expect(parseCoverageOutput(input)).toBe(expected);
  });
});

describe('parsePackageSrcCoverage()', () => {
  const SAMPLE = [
    '-------------------------|---------|---------|-------------------',
    'File                     | % Funcs | % Lines | Uncovered Line #s',
    '-------------------------|---------|---------|-------------------',
    'All files                |   80.00 |   70.00 |',
    ' ../config/src/env.ts    |    0.00 |   13.16 | 3-20',
    ' src/pool.ts             |   84.21 |   68.00 | 69-70',
    ' src/index.ts            |  100.00 |  100.00 |',
    '-------------------------|---------|---------|-------------------',
  ].join('\n');

  test('averages only src/ files', () => {
    expect(parsePackageSrcCoverage(SAMPLE)).toBeCloseTo(84, 0);
  });

  test('no src/ lines returns null', () => {
    expect(parsePackageSrcCoverage('All files | 100.00 | 100.00 |')).toBeNull();
  });

  test('single src/ file', () => {
    const output = ' src/main.ts | 100.00 | 75.00 |';
    expect(parsePackageSrcCoverage(output)).toBe(75);
  });
});

describe('decideCoverageRun()', () => {
  test.each([
    {
      exitCode: 0,
      coverage: 80,
      threshold: 70,
      expectedOk: true,
    },
    {
      exitCode: 1,
      coverage: 95,
      threshold: 70,
      expectedOk: false,
      expectedReason: 'subprocess exited',
    },
    {
      exitCode: 0,
      coverage: null,
      threshold: 70,
      expectedOk: false,
      expectedReason: 'summary absent',
    },
    {
      exitCode: 0,
      coverage: 50,
      threshold: 70,
      expectedOk: false,
      expectedReason: '< 70%',
    },
  ])(
    'decides based on $exitCode and coverage',
    ({ exitCode, coverage, threshold, expectedOk, expectedReason }) => {
      const decision = decideCoverageRun(makeRun({ exitCode, coverage }), threshold);
      expect(decision.ok).toBe(expectedOk);
      if (expectedReason) expect(decision.reason).toContain(expectedReason);
    },
  );
});

describe('LAYER_THRESHOLDS', () => {
  test('includes web-assets', () => {
    const dirs = LAYER_THRESHOLDS.map((l) => l.dir);
    expect(dirs).toContain('packages/web-assets');
  });

  test('includes testkit packages', () => {
    const dirs = LAYER_THRESHOLDS.map((l) => l.dir);
    expect(dirs).toContain('packages/testkit-base');
    expect(dirs).toContain('packages/testkit');
  });

  test('no skipIfNoSummary entries', () => {
    for (const layer of LAYER_THRESHOLDS) {
      expect(Object.keys(layer)).not.toContain('skipIfNoSummary');
    }
  });
});
