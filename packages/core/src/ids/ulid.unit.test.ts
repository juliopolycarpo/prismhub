import { describe, expect, test } from 'bun:test';
import { isUlid, ulid } from './ulid.ts';

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe('ulid()', () => {
  test('generates a 26-character string', () => {
    expect(ulid()).toHaveLength(26);
  });

  test('uses only Crockford base-32 alphabet', () => {
    for (let i = 0; i < 50; i++) {
      expect(ULID_RE.test(ulid())).toBe(true);
    }
  });

  test('encodes the given timestamp in the first 10 characters', () => {
    const ts = 1_700_000_000_000;
    const id = ulid(ts);
    // Decode time prefix: first 10 chars represent ts / 32^n descending.
    const prefix = id.slice(0, 10);
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let decoded = 0;
    for (const ch of prefix) {
      decoded = decoded * 32 + alphabet.indexOf(ch);
    }
    expect(decoded).toBe(ts);
  });

  test('generates unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => ulid()));
    expect(ids.size).toBe(100);
  });
});

describe('isUlid()', () => {
  test('returns true for valid ulids', () => {
    expect(isUlid(ulid())).toBe(true);
    expect(isUlid('01HZ0000000000000000000000')).toBe(true);
  });

  test('returns false for invalid strings', () => {
    expect(isUlid('')).toBe(false);
    expect(isUlid('too-short')).toBe(false);
    expect(isUlid('01HZ000000000000000000000L')).toBe(false); // L is not in alphabet
    expect(isUlid('01HZ0000000000000000000000X')).toBe(false); // 27 chars
  });
});
