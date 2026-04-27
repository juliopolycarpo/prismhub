import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { frozenClock } from '@prismhub/testkit-base';
import { createCoreTestServices, type CoreTestServices } from '../testing/test-services.ts';

let services: CoreTestServices;

beforeEach(async () => {
  services = await createCoreTestServices({ now: frozenClock(1_700_000_000_000) });
});

afterEach(async () => {
  await services.cleanup();
});

describe('SettingsService.read()', () => {
  test('returns defaults from migrations seed', async () => {
    const settings = await services.settingsService.read();
    expect(settings.themeMode).toBe('system');
    expect(settings.density).toBe('comfortable');
    expect(settings.showMetadata).toBe(true);
  });
});

describe('SettingsService.update()', () => {
  test('updates themeMode to dark', async () => {
    const updated = await services.settingsService.update({ themeMode: 'dark' });
    expect(updated.themeMode).toBe('dark');
  });

  test('unknown themeMode string defaults to system at boundary', async () => {
    const { db } = services;
    await db.updateTable('settings').set({ theme_mode: 'rainbow' }).where('id', '=', 1).execute();
    const settings = await services.settingsService.read();
    expect(settings.themeMode).toBe('system');
  });
});
