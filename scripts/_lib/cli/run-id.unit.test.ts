import { describe, expect, test } from 'bun:test';
import { getRunId } from './run-id';

describe('getRunId()', () => {
  test('produces a filesystem-safe ISO timestamp without ms', () => {
    const fixed = new Date('2026-04-24T15:32:07.123Z');
    expect(getRunId(fixed)).toBe('2026-04-24T15-32-07');
  });

  test('uses now() by default and matches the expected pattern', () => {
    const id = getRunId();
    expect(id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  test('is stable across calls with the same Date instance', () => {
    const fixed = new Date('2026-01-02T03:04:05.000Z');
    expect(getRunId(fixed)).toBe(getRunId(fixed));
  });
});
