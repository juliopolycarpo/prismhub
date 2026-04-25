import { describe, expect, test } from 'bun:test';
import { parseTscOutput } from './tsc';

describe('parseTscOutput()', () => {
  test('extracts errors and files from the summary line', () => {
    const output = [
      'src/foo.ts(12,3): error TS2322: Type "x" is not assignable to "y".',
      'src/bar.ts(4,5): error TS2345: Argument "a" missing.',
      '',
      'Found 2 errors in 2 files.',
    ].join('\n');

    expect(parseTscOutput(output)).toEqual({ errors: 2, files: 2 });
  });

  test('handles the singular forms produced by tsc', () => {
    const output = 'src/only.ts(1,1): error TS1002: ...\nFound 1 error in 1 file.';
    expect(parseTscOutput(output)).toEqual({ errors: 1, files: 1 });
  });

  test('falls back to counting error TS lines when no summary exists', () => {
    const output = [
      'src/foo.ts(1,1): error TS2322: ...',
      'src/bar.ts(2,2): error TS2322: ...',
      'src/bar.ts(3,3): error TS2322: ...',
    ].join('\n');

    expect(parseTscOutput(output)).toEqual({ errors: 3, files: 0 });
  });

  test('returns zero errors for clean output', () => {
    expect(parseTscOutput('')).toEqual({ errors: 0, files: 0 });
    expect(parseTscOutput('tsconfig.json loaded\nall good\n')).toEqual({ errors: 0, files: 0 });
  });
});
