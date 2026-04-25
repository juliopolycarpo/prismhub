import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { frozenClock } from '@prismhub/testkit-base';
import { createTestServices, type TestServices } from './services.ts';

describe('createTestServices()', () => {
  let services: TestServices;

  beforeEach(async () => {
    services = await createTestServices();
  });

  afterEach(async () => {
    await services.cleanup();
  });

  test('wires every service required by the app', () => {
    expect(services.db).toBeDefined();
    expect(services.bus).toBeDefined();
    expect(services.sessionService).toBeDefined();
    expect(services.mcpRegistryService).toBeDefined();
    expect(services.settingsService).toBeDefined();
    expect(services.statusService).toBeDefined();
  });

  test('reads default settings from migrated database', async () => {
    const settings = await services.settingsService.read();

    expect(settings).toBeDefined();
    expect(typeof settings.themeMode).toBe('string');
  });
});

describe('createTestServices() cleanup', () => {
  test('closes database so further reads fail', async () => {
    const services = await createTestServices();
    const status = await services.statusService.snapshot();
    expect(status).toBeDefined();

    await services.cleanup();

    let threw: unknown;
    try {
      await services.settingsService.read();
    } catch (err) {
      threw = err;
    }
    expect(threw).toBeDefined();
  });

  test('honors now and version options', async () => {
    const services = await createTestServices({
      version: 'unit-test-version',
      now: frozenClock(1_700_000_000_000),
    });

    try {
      const status = await services.statusService.snapshot();
      expect(status.version).toBe('unit-test-version');
      expect(status.uptimeSec).toBe(0);
    } finally {
      await services.cleanup();
    }
  });
});
