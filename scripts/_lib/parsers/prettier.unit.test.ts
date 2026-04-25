import { describe, expect, test } from 'bun:test';
import { parsePrettierCheck } from './prettier';

describe('parsePrettierCheck()', () => {
  test('reports zero unformatted files on a clean run', () => {
    const stdout = 'Checking formatting...\nAll matched files use Prettier code style!\n';
    expect(parsePrettierCheck('', stdout)).toEqual({ unformatted: 0, files: [] });
  });

  test('collects file paths from [warn] lines and ignores the summary warn', () => {
    const stderr = [
      '[warn] apps/web/src/main.tsx',
      '[warn] packages/core/src/index.ts',
      '[warn] Code style issues found in 2 files. Run Prettier with --write to fix.',
    ].join('\n');

    expect(parsePrettierCheck(stderr, 'Checking formatting...\n')).toEqual({
      unformatted: 2,
      files: ['apps/web/src/main.tsx', 'packages/core/src/index.ts'],
    });
  });

  test('prefers the summary count when file listing is truncated', () => {
    const stderr = '[warn] only-one-shown.ts\n[warn] Code style issues found in 5 files.';
    const result = parsePrettierCheck(stderr, '');
    expect(result.unformatted).toBe(5);
    expect(result.files).toEqual(['only-one-shown.ts']);
  });

  test('handles singular "1 file" summary', () => {
    const stderr = '[warn] a.ts\n[warn] Code style issues found in 1 file.';
    expect(parsePrettierCheck(stderr, '')).toEqual({
      unformatted: 1,
      files: ['a.ts'],
    });
  });

  test('returns zero for empty input', () => {
    expect(parsePrettierCheck('', '')).toEqual({ unformatted: 0, files: [] });
  });
});
