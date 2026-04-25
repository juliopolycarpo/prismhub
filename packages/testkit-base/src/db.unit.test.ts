import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createTempDatabaseHandle } from './db.ts';

describe('createTempDatabaseHandle()', () => {
  test('returns a database path inside a freshly created data directory', () => {
    const handle = createTempDatabaseHandle();

    try {
      expect(existsSync(handle.dataDir)).toBe(true);
      expect(handle.databasePath.endsWith('database.sqlite')).toBe(true);
      expect(dirname(handle.databasePath)).toBe(handle.dataDir);
    } finally {
      handle.cleanup();
    }
  });

  test('cleanup() removes the data directory', () => {
    const handle = createTempDatabaseHandle();

    handle.cleanup();

    expect(existsSync(handle.dataDir)).toBe(false);
  });

  test('successive calls return distinct paths', () => {
    const a = createTempDatabaseHandle();
    const b = createTempDatabaseHandle();

    try {
      expect(a.dataDir).not.toBe(b.dataDir);
    } finally {
      a.cleanup();
      b.cleanup();
    }
  });
});
