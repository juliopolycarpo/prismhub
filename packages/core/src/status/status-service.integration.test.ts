import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { frozenClock } from '@prismhub/testkit-base';
import { createCoreTestServices, type CoreTestServices } from '../testing/test-services.ts';

describe('StatusService.snapshot()', () => {
  let services: CoreTestServices;

  beforeEach(async () => {
    services = await createCoreTestServices({
      version: '1.2.3',
      now: frozenClock(1_700_000_000_000),
    });
  });

  afterEach(async () => {
    await services.cleanup();
  });

  test('returns version and dbReady=true', async () => {
    const snap = await services.statusService.snapshot();
    expect(snap.version).toBe('1.2.3');
    expect(snap.dbReady).toBe(true);
  });

  test('reports uptimeSec based on startedAt', async () => {
    const snap = await services.statusService.snapshot();
    // startedAt is frozen at the same timestamp, so uptime = 0
    expect(snap.uptimeSec).toBe(0);
  });

  test('counts upstreams from DB', async () => {
    await services.mcpRegistryService.register({ name: 'srv', transport: 'stdio', command: 'x' });
    const snap = await services.statusService.snapshot();
    expect(snap.upstreamsCount).toBe(1);
  });
});
