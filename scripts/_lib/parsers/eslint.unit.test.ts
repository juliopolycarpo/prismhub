import { describe, expect, test } from 'bun:test';
import { parseEslintJson } from './eslint';

describe('parseEslintJson()', () => {
  test('aggregates errors, warnings and file counts', () => {
    const json = JSON.stringify([
      { filePath: '/a.ts', errorCount: 2, warningCount: 1 },
      { filePath: '/b.ts', errorCount: 0, warningCount: 0 },
      { filePath: '/c.ts', errorCount: 1, warningCount: 3 },
    ]);

    expect(parseEslintJson(json)).toEqual({
      errors: 3,
      warnings: 4,
      files: 3,
      filesWithProblems: 2,
    });
  });

  test('returns zeros for an empty array', () => {
    expect(parseEslintJson('[]')).toEqual({
      errors: 0,
      warnings: 0,
      files: 0,
      filesWithProblems: 0,
    });
  });

  test('returns null for malformed JSON', () => {
    expect(parseEslintJson('not json')).toBeNull();
    expect(parseEslintJson('')).toBeNull();
  });

  test('returns null when JSON is not an array', () => {
    expect(parseEslintJson('{"foo":1}')).toBeNull();
  });

  test('treats missing errorCount/warningCount as zero', () => {
    const json = JSON.stringify([{ filePath: '/a.ts' }, { filePath: '/b.ts', errorCount: 1 }]);
    expect(parseEslintJson(json)).toEqual({
      errors: 1,
      warnings: 0,
      files: 2,
      filesWithProblems: 1,
    });
  });
});
