import { describe, expect, test } from 'bun:test';
import { frozenClock } from './clock.ts';

describe('frozenClock()', () => {
  test('returns the same epoch on every call', () => {
    const clock = frozenClock(1_700_000_000_000);

    expect(clock()).toBe(1_700_000_000_000);
    expect(clock()).toBe(1_700_000_000_000);
    expect(clock()).toBe(1_700_000_000_000);
  });

  test('different instances are independent', () => {
    const a = frozenClock(1);
    const b = frozenClock(2);

    expect(a()).toBe(1);
    expect(b()).toBe(2);
  });
});
