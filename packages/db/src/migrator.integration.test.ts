import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createTempDatabaseHandle } from '@prismhub/testkit-base';
import type { TempDatabaseHandle } from '@prismhub/testkit-base';
import { closeDatabase, createDatabase, type PrismDatabase } from './client.ts';
import { revertMigrations, runMigrations } from './migrator.ts';
import { insertSession, listSessions } from './repositories/sessions.repository.ts';
import { readSettings } from './repositories/settings.repository.ts';
import { insertSessionEvent, listSessionEvents } from './repositories/session-events.repository.ts';

let handle: TempDatabaseHandle;
let db: PrismDatabase;

beforeEach(() => {
  handle = createTempDatabaseHandle();
  db = createDatabase({ filename: handle.databasePath });
});

afterEach(async () => {
  await closeDatabase(db);
  handle.cleanup();
});

describe('runMigrations', () => {
  test('applies pending migrations on first run', async () => {
    const result = await runMigrations(db);
    expect(result.applied).toEqual(['0001_init', '0002_mcp_headers', '0003_better_auth']);
    expect(result.alreadyApplied).toEqual([]);
  });

  test('is idempotent', async () => {
    await runMigrations(db);
    const second = await runMigrations(db);
    expect(second.applied).toEqual([]);
    expect(second.alreadyApplied).toEqual(['0001_init', '0002_mcp_headers', '0003_better_auth']);
  });

  test('seeds default settings row', async () => {
    await runMigrations(db);
    const settings = await readSettings(db);
    expect(settings.themeMode).toBe('system');
    expect(settings.accentColor).toBe('#F97316');
    expect(settings.showMetadata).toBe(true);
  });
});

describe('revertMigrations', () => {
  test('reverts applied migrations', async () => {
    await runMigrations(db);
    const result = await revertMigrations(db);
    expect(result.applied).toEqual(['0003_better_auth', '0002_mcp_headers', '0001_init']);
    expect(result.alreadyApplied).toEqual([]);
  });

  test('skips unapplied migrations', async () => {
    const result = await revertMigrations(db);
    expect(result.applied).toEqual([]);
    expect(result.alreadyApplied).toEqual(['0003_better_auth', '0002_mcp_headers', '0001_init']);
  });

  test('round-trip up-down-up produces consistent schema', async () => {
    await runMigrations(db);
    await revertMigrations(db);
    const second = await runMigrations(db);

    expect(second.applied).toEqual(['0001_init', '0002_mcp_headers', '0003_better_auth']);
    const settings = await readSettings(db);
    expect(settings.themeMode).toBe('system');
    expect(settings.accentColor).toBe('#F97316');
  });
});

describe('sessions repository', () => {
  test('inserts and lists sessions', async () => {
    await runMigrations(db);
    await insertSession(db, {
      id: '01HTESTULID00000000000001',
      source: 'claude-code',
      agent: 'Claude',
      title: null,
      workingDir: null,
      startedAt: '2026-04-21T00:00:00.000Z',
      metadata: null,
    });

    const sessions = await listSessions(db);
    expect(sessions).toHaveLength(1);
    const first = sessions[0];
    if (!first) throw new Error('expected a session');
    expect(first.id).toBe('01HTESTULID00000000000001');
    expect(first.status).toBe('active');
  });
});

describe('session events cascade', () => {
  test('events persist and read back in order', async () => {
    await runMigrations(db);
    const sessionId = '01HTESTULID00000000000002';
    await insertSession(db, {
      id: sessionId,
      source: 'codex',
      agent: 'Codex',
      title: null,
      workingDir: null,
      startedAt: '2026-04-21T00:00:00.000Z',
      metadata: null,
    });

    await insertSessionEvent(db, {
      id: '01HTESTEVENT0000000000001',
      sessionId,
      kind: 'message',
      payload: { role: 'user', content: 'hi' },
      at: '2026-04-21T00:00:01.000Z',
    });

    const events = await listSessionEvents(db, sessionId);
    expect(events).toHaveLength(1);
    const event = events[0];
    if (!event) throw new Error('expected one event');
    expect(event.kind).toBe('message');
  });
});
