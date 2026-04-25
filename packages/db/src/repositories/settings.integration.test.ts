import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { type PrismDatabase } from '../index.ts';
import { readSettings, updateSettings } from './settings.repository.ts';
import { createTestDatabase } from './test-helpers.ts';

let db: PrismDatabase;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const test = await createTestDatabase();
  db = test.db;
  cleanup = test.cleanup;
});

afterEach(async () => {
  await cleanup();
});

describe('readSettings()', () => {
  test('returns seeded defaults', async () => {
    const row = await readSettings(db);
    expect(row.themeMode).toBe('system');
    expect(row.accentColor).toBe('#F97316');
    expect(row.density).toBe('comfortable');
    expect(row.showMetadata).toBe(true);
  });
});

describe('updateSettings()', () => {
  test('updates themeMode', async () => {
    const updated = await updateSettings(db, { themeMode: 'dark' });
    expect(updated.themeMode).toBe('dark');
  });

  test('partial update only changes specified fields', async () => {
    await updateSettings(db, { accentColor: '#ff0000' });
    const row = await readSettings(db);
    expect(row.accentColor).toBe('#ff0000');
    expect(row.themeMode).toBe('system');
  });

  test('updates showMetadata', async () => {
    const updated = await updateSettings(db, { showMetadata: true });
    expect(updated.showMetadata).toBe(true);
  });
});
