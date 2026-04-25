import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { type PrismDatabase } from '../index.ts';
import {
  getSessionByIdOrThrow,
  incrementSessionCounter,
  insertSession,
  closeSession,
  listSessions,
} from './sessions.repository.ts';
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

const BASE_SESSION = {
  id: '01HTEST0000000000000000001',
  source: 'claude-code',
  agent: 'Claude',
  title: null,
  workingDir: null,
  startedAt: '2026-01-01T00:00:00.000Z',
  metadata: null,
} as const;

describe('insertSession()', () => {
  test('inserts and returns the session', async () => {
    const row = await insertSession(db, BASE_SESSION);
    expect(row.id).toBe(BASE_SESSION.id);
    expect(row.source).toBe('claude-code');
    expect(row.status).toBe('active');
    expect(row.messageCount).toBe(0);
    expect(row.toolCallCount).toBe(0);
  });

  test('is idempotent — duplicate inserts do not throw', async () => {
    await insertSession(db, BASE_SESSION);
    expect(await insertSession(db, BASE_SESSION)).toBeDefined();
  });
});

describe('listSessions()', () => {
  test('returns empty array when no sessions', async () => {
    expect(await listSessions(db)).toHaveLength(0);
  });

  test('returns inserted sessions ordered by started_at desc', async () => {
    await insertSession(db, {
      ...BASE_SESSION,
      id: '01HTEST0000000000000000001',
      startedAt: '2026-01-01T00:00:00.000Z',
    });
    await insertSession(db, {
      ...BASE_SESSION,
      id: '01HTEST0000000000000000002',
      startedAt: '2026-01-02T00:00:00.000Z',
    });
    const rows = await listSessions(db);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe('01HTEST0000000000000000002');
  });
});

describe('incrementSessionCounter()', () => {
  test('increments message_count atomically', async () => {
    await insertSession(db, BASE_SESSION);
    await incrementSessionCounter(db, BASE_SESSION.id, 'message_count');
    await incrementSessionCounter(db, BASE_SESSION.id, 'message_count');
    const row = await getSessionByIdOrThrow(db, BASE_SESSION.id);
    expect(row.messageCount).toBe(2);
  });

  test('increments tool_call_count atomically', async () => {
    await insertSession(db, BASE_SESSION);
    await incrementSessionCounter(db, BASE_SESSION.id, 'tool_call_count');
    const row = await getSessionByIdOrThrow(db, BASE_SESSION.id);
    expect(row.toolCallCount).toBe(1);
  });

  test('does nothing when session does not exist', async () => {
    const result = await incrementSessionCounter(db, 'NONEXISTENT_ID_00000000000', 'message_count');
    expect(result).toBeUndefined();
  });
});

describe('closeSession()', () => {
  test('marks session as completed with endedAt', async () => {
    await insertSession(db, BASE_SESSION);
    await closeSession(db, {
      id: BASE_SESSION.id,
      endedAt: '2026-01-01T01:00:00.000Z',
      status: 'completed',
    });
    const row = await getSessionByIdOrThrow(db, BASE_SESSION.id);
    expect(row.status).toBe('completed');
    expect(row.endedAt).toBe('2026-01-01T01:00:00.000Z');
  });
});
