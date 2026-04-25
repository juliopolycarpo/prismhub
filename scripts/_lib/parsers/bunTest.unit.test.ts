import { describe, expect, test } from 'bun:test';
import { parseBunTestCounts } from './bunTest';

describe('parseBunTestCounts()', () => {
  test.each([
    {
      input: [
        ' 3 pass',
        ' 0 fail',
        ' 12 expect() calls',
        'Ran 3 tests across 1 files. [42.00ms]',
      ].join('\n'),
      expected: { passed: 3, failed: 0, total: 3, files: 1 },
    },
    {
      input: [' 10 pass', ' 1 fail', 'Ran 11 tests across 3 files. [120ms]'].join('\n'),
      expected: { passed: 10, failed: 1, total: 11, files: 3 },
    },
    {
      input: [
        '@prismhub/core:test:  5 pass',
        '@prismhub/core:test:  0 fail',
        '@prismhub/core:test: Ran 5 tests across 2 files. [50ms]',
        '@prismhub/db:test:  8 pass',
        '@prismhub/db:test:  1 fail',
        '@prismhub/db:test: Ran 9 tests across 3 files. [80ms]',
      ].join('\n'),
      expected: { passed: 13, failed: 1, total: 14, files: 5 },
    },
    { input: '', expected: null },
    { input: 'unrelated output\nno bun test here', expected: null },
    { input: ' 7 pass\n 2 fail', expected: { passed: 7, failed: 2, total: 9, files: 0 } },
    {
      input: [
        '\x1b[0m\x1b[32m 16 pass\x1b[0m',
        '\x1b[0m\x1b[2m 0 fail\x1b[0m',
        ' 18 expect() calls',
        'Ran 16 tests across 2 files. \x1b[0m\x1b[2m[\x1b[1m115.00ms\x1b[0m\x1b[2m]',
      ].join('\n'),
      expected: { passed: 16, failed: 0, total: 16, files: 2 },
    },
    {
      input: ' 0 pass\n 0 fail\nRan 0 tests across 0 files. [1ms]',
      expected: { passed: 0, failed: 0, total: 0, files: 0 },
    },
  ])('parses $input description', ({ input, expected }) => {
    expect(parseBunTestCounts(input)).toEqual(expected);
  });
});
