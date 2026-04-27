import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { type PrismDatabase } from '../index.ts';
import { insertSession } from './sessions.repository.ts';
import {
  insertSessionEvent,
  listSessionEvents,
  type InsertSessionEvent,
} from './session-events.repository.ts';
import { createTestDatabase } from './test-helpers.ts';

let db: PrismDatabase;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const test = await createTestDatabase();
  db = test.db;
  cleanup = test.cleanup;
  await insertSession(db, {
    id: SESSION_ID,
    source: 'claude-code',
    agent: 'Claude',
    title: null,
    workingDir: null,
    startedAt: '2026-01-01T00:00:00.000Z',
    metadata: null,
  });
});

afterEach(async () => {
  await cleanup();
});

const SESSION_ID = '01HSESSEVT00000000000000001';

function makeEvent(overrides: Partial<InsertSessionEvent> = {}): InsertSessionEvent {
  return {
    id: '01HEVT00000000000000000001',
    sessionId: SESSION_ID,
    kind: 'message',
    payload: { role: 'user', text: 'hello' },
    at: '2026-01-01T00:00:01.000Z',
    ...overrides,
  };
}

describe('insertSessionEvent()', () => {
  test('inserts an event and round-trips the JSON payload', async () => {
    await insertSessionEvent(db, makeEvent());
    const rows = await listSessionEvents(db, SESSION_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('01HEVT00000000000000000001');
    expect(rows[0]?.sessionId).toBe(SESSION_ID);
    expect(rows[0]?.kind).toBe('message');
    expect(rows[0]?.payload).toEqual({ role: 'user', text: 'hello' });
  });

  test('persists complex payload shapes (arrays, nested objects, primitives)', async () => {
    const payload = { tool: 'shell', args: ['ls', '-la'], meta: { ok: true, count: 3 } };
    await insertSessionEvent(db, makeEvent({ payload }));
    const rows = await listSessionEvents(db, SESSION_ID);
    expect(rows[0]?.payload).toEqual(payload);
  });
});

describe('listSessionEvents()', () => {
  test('returns empty array when no events exist for the session', async () => {
    expect(await listSessionEvents(db, SESSION_ID)).toHaveLength(0);
  });

  test('returns events filtered by sessionId', async () => {
    const otherSessionId = '01HSESSEVT00000000000000099';
    await insertSession(db, {
      id: otherSessionId,
      source: 'claude-code',
      agent: 'Claude',
      title: null,
      workingDir: null,
      startedAt: '2026-01-01T00:00:00.000Z',
      metadata: null,
    });
    await insertSessionEvent(db, makeEvent({ id: '01HEVT00000000000000000001' }));
    await insertSessionEvent(
      db,
      makeEvent({
        id: '01HEVT00000000000000000002',
        sessionId: otherSessionId,
      }),
    );

    const rows = await listSessionEvents(db, SESSION_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('01HEVT00000000000000000001');
  });

  test('orders events by `at` ascending', async () => {
    await insertSessionEvent(
      db,
      makeEvent({ id: '01HEVT00000000000000000002', at: '2026-01-01T00:00:03.000Z' }),
    );
    await insertSessionEvent(
      db,
      makeEvent({ id: '01HEVT00000000000000000001', at: '2026-01-01T00:00:01.000Z' }),
    );
    await insertSessionEvent(
      db,
      makeEvent({ id: '01HEVT00000000000000000003', at: '2026-01-01T00:00:02.000Z' }),
    );

    const rows = await listSessionEvents(db, SESSION_ID);
    expect(rows.map((row) => row.id)).toEqual([
      '01HEVT00000000000000000001',
      '01HEVT00000000000000000003',
      '01HEVT00000000000000000002',
    ]);
  });

  test('respects the limit parameter', async () => {
    for (let i = 1; i <= 5; i += 1) {
      await insertSessionEvent(
        db,
        makeEvent({
          id: `01HEVT0000000000000000000${i}`,
          at: `2026-01-01T00:00:0${i}.000Z`,
        }),
      );
    }

    const rows = await listSessionEvents(db, SESSION_ID, 3);
    expect(rows).toHaveLength(3);
  });
});
