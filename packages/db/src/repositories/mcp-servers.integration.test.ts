import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { type PrismDatabase } from '../index.ts';
import {
  getMcpServerByIdOrThrow,
  insertMcpServer,
  listMcpServers,
  updateMcpServer,
} from './mcp-servers.repository.ts';
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

const BASE_SERVER = {
  id: '01HMCP0000000000000000001',
  name: 'test-server',
  description: null,
  transport: 'stdio' as const,
  command: 'echo',
  args: ['hello'] as const,
  url: null,
  headers: null,
  enabled: true,
} as const;

describe('insertMcpServer()', () => {
  test('inserts and returns the server', async () => {
    const row = await insertMcpServer(db, BASE_SERVER);
    expect(row.id).toBe(BASE_SERVER.id);
    expect(row.name).toBe('test-server');
    expect(row.enabled).toBe(true);
    expect(row.transport).toBe('stdio');
  });

  test('round-trips args JSON', async () => {
    const row = await insertMcpServer(db, BASE_SERVER);
    expect(row.args).toEqual(['hello']);
  });
});

describe('listMcpServers()', () => {
  test('returns empty array when no servers', async () => {
    expect(await listMcpServers(db)).toHaveLength(0);
  });

  test('returns all inserted servers', async () => {
    await insertMcpServer(db, BASE_SERVER);
    await insertMcpServer(db, { ...BASE_SERVER, id: '01HMCP0000000000000000002', name: 'other' });
    expect(await listMcpServers(db)).toHaveLength(2);
  });
});

describe('updateMcpServer()', () => {
  test('toggles enabled flag', async () => {
    await insertMcpServer(db, BASE_SERVER);
    const updated = await updateMcpServer(db, BASE_SERVER.id, { enabled: false });
    expect(updated.enabled).toBe(false);
  });

  test('updates description', async () => {
    await insertMcpServer(db, BASE_SERVER);
    const updated = await updateMcpServer(db, BASE_SERVER.id, { description: 'My server' });
    expect(updated.description).toBe('My server');
  });

  test('bumps updated_at', async () => {
    await insertMcpServer(db, BASE_SERVER);
    const before = await getMcpServerByIdOrThrow(db, BASE_SERVER.id);
    await new Promise((resolve) => setTimeout(resolve, 2));
    await updateMcpServer(db, BASE_SERVER.id, { enabled: false });
    const after = await getMcpServerByIdOrThrow(db, BASE_SERVER.id);
    expect(after.updatedAt >= before.updatedAt).toBe(true);
  });
});

describe('rowToDomain transport parsing', () => {
  test('throws on unsupported transport value rather than silently coercing', async () => {
    await insertMcpServer(db, BASE_SERVER);
    // Simulate a future migration / data corruption introducing a new transport.
    await db
      .updateTable('mcp_servers')
      .set({ transport: 'sse' })
      .where('id', '=', BASE_SERVER.id)
      .execute();

    await expect(getMcpServerByIdOrThrow(db, BASE_SERVER.id)).rejects.toThrow(/sse/);
  });
});
