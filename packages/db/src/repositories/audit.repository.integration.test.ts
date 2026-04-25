import { afterEach, beforeEach, describe, test } from 'bun:test';
import { type PrismDatabase } from '../index.ts';
import { insertAuditEvent } from './audit.repository.ts';
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

describe('insertAuditEvent()', () => {
  test.each([
    {
      id: '01HAUDIT000000000000000001',
      at: '2024-01-01T00:00:00.000Z',
      action: 'session.started',
      actor: 'claude-code',
      target: 'session:abc123',
      details: undefined as Record<string, unknown> | undefined,
    },
    {
      id: '01HAUDIT000000000000000002',
      at: '2024-01-01T00:00:00.000Z',
      action: 'session.ended',
      actor: 'claude-code',
      target: 'session:abc123',
      details: { reason: 'completed', tokenCount: 1200 },
    },
  ])('inserts an event', async ({ id, at, action, actor, target, details }) => {
    await insertAuditEvent(db, {
      id,
      at,
      action,
      actor,
      target,
      ...(details === undefined ? {} : { details }),
    });
  });
});
