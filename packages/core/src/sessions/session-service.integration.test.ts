import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createTempDatabaseHandle, type TempDatabaseHandle } from '@prismhub/testkit-base';
import {
  closeDatabase,
  createDatabase,
  getSessionByIdOrThrow,
  listSessionEvents,
  type PrismDatabase,
  runMigrations,
} from '@prismhub/db';
import { createEventBus } from '../events/bus.ts';
import type { FeedEnvelope } from '../events/bus.types.ts';
import { createSessionService } from './session-service.ts';

let handle: TempDatabaseHandle;
let db: PrismDatabase;

beforeEach(async () => {
  handle = createTempDatabaseHandle();
  db = createDatabase({ filename: handle.databasePath });
  await runMigrations(db);
});

afterEach(async () => {
  await closeDatabase(db);
  handle.cleanup();
});

describe('SessionService', () => {
  test('ingestStart persists session and publishes feed event', async () => {
    const bus = createEventBus();
    const published: FeedEnvelope[] = [];
    bus.subscribe('feed', (e) => published.push(e));
    const service = createSessionService({ db, bus });

    await service.ingestStart({
      sessionId: '01HTESTULID00000000000001',
      source: 'claude-code',
      agent: 'Claude',
      startedAt: '2026-04-21T00:00:00.000Z',
    });

    const row = await getSessionByIdOrThrow(db, '01HTESTULID00000000000001');
    expect(row.status).toBe('active');
    expect(published).toHaveLength(1);
    const first = published[0];
    if (!first) throw new Error('expected feed event');
    expect(first.event.kind).toBe('session_started');
  });

  test('ingestEvent increments counters and persists an event row', async () => {
    const bus = createEventBus();
    const service = createSessionService({ db, bus });
    const sessionId = '01HTESTULID00000000000002';

    await service.ingestStart({
      sessionId,
      source: 'codex',
      agent: 'Codex',
      startedAt: '2026-04-21T00:00:00.000Z',
    });
    await service.ingestEvent({
      sessionId,
      kind: 'message',
      role: 'user',
      content: 'hello',
      at: '2026-04-21T00:00:01.000Z',
    });

    const events = await listSessionEvents(db, sessionId);
    expect(events).toHaveLength(1);
    const after = await getSessionByIdOrThrow(db, sessionId);
    expect(after.messageCount).toBe(1);
  });

  test('ingestEnd closes the session with the given reason', async () => {
    const bus = createEventBus();
    const service = createSessionService({ db, bus });
    const sessionId = '01HTESTULID00000000000003';

    await service.ingestStart({
      sessionId,
      source: 'vscode',
      agent: 'VSCode',
      startedAt: '2026-04-21T00:00:00.000Z',
    });
    await service.ingestEnd({
      sessionId,
      endedAt: '2026-04-21T00:01:00.000Z',
      reason: 'completed',
    });

    const after = await getSessionByIdOrThrow(db, sessionId);
    expect(after.status).toBe('completed');
    expect(after.endedAt).toBe('2026-04-21T00:01:00.000Z');
  });
});
