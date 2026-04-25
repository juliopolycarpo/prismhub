import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createAppApi } from '@prismhub/app-api';
import { createAuth, createAuthPlugin, type AuthInstance } from '@prismhub/auth';
import type { RuntimeConfig } from '@prismhub/config';
import {
  createEventBus,
  createMcpRegistryService,
  createSessionService,
  createSettingsService,
  createStatusService,
  type SettingsService,
} from '@prismhub/core';
import { closeDatabase, createDatabase, type PrismDatabase, runMigrations } from '@prismhub/db';
import { createTempDatabaseHandle, type TempDatabaseHandle } from '@prismhub/testkit-base';
import type { WebAsset } from '@prismhub/web-assets';
import { Elysia } from 'elysia';
import { createPrismServer, listen, type PrismServer } from './server.ts';

const TEST_AUTH_CONFIG = {
  env: 'test',
  auth: {
    secret: 'prismhub-test-only-secret-do-not-use-in-production-xxxxxxxxxxxxxxxx',
    baseUrl: 'http://local',
    trustedOrigins: ['http://local'],
  },
} as unknown as RuntimeConfig;

function makeAuth(db: PrismDatabase, settingsService: SettingsService): AuthInstance {
  return createAuth({ db, settingsService, config: TEST_AUTH_CONFIG });
}

let handle: TempDatabaseHandle;
let db: PrismDatabase;
let server: PrismServer;
let adminCookie: string;

beforeEach(async () => {
  handle = createTempDatabaseHandle();
  db = createDatabase({ filename: handle.databasePath });
  await runMigrations(db);

  const bus = createEventBus();
  const sessionService = createSessionService({ db, bus });
  const mcpRegistryService = createMcpRegistryService({ db });
  const settingsService = createSettingsService({ db });
  const statusService = createStatusService({ db, version: 'test', startedAt: Date.now() });
  const auth = makeAuth(db, settingsService);

  const appApi = createAppApi({
    db,
    bus,
    auth,
    statusService,
    mcpRegistryService,
    settingsService,
    sessionService,
  });
  server = createPrismServer({
    appApi,
    statusService,
    authPlugin: createAuthPlugin({ auth }),
  });

  const signUp = await server.handle(
    new Request('http://local/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@prismhub.test',
        password: 'admin-test-password',
        name: 'Admin',
      }),
    }),
  );
  if (signUp.status !== 200) {
    throw new Error(`bootstrap failed: ${signUp.status} ${await signUp.text()}`);
  }
  adminCookie = (signUp.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
});

afterEach(async () => {
  await closeDatabase(db);
  handle.cleanup();
});

async function request(server: PrismServer, cookie: string, path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (cookie && !headers.has('cookie')) headers.set('cookie', cookie);
  return server.handle(new Request(`http://local${path}`, { ...init, headers }));
}

describe('PrismServer', () => {
  test('GET /healthz returns ok', async () => {
    const res = await request(server, adminCookie, '/healthz');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  test('GET /readyz returns ok after migrations', async () => {
    const res = await request(server, adminCookie, '/readyz');
    expect(res.status).toBe(200);
  });

  test('GET /mcp returns 501 placeholder', async () => {
    const res = await request(server, adminCookie, '/mcp');
    expect(res.status).toBe(501);
  });

  test('GET /api/app/status returns snapshot', async () => {
    const res = await request(server, adminCookie, '/api/app/status');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string; dbReady: boolean };
    expect(body.version).toBe('test');
    expect(body.dbReady).toBe(true);
  });

  test('POST /api/v1/hooks/session-start persists + emits event', async () => {
    const res = await request(server, adminCookie, '/api/v1/hooks/session-start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: '01HTEST0000000000000000ABC',
        source: 'claude-code',
        agent: 'Claude',
        startedAt: '2026-04-21T00:00:00.000Z',
      }),
    });
    expect(res.status).toBe(200);

    const listRes = await request(server, adminCookie, '/api/app/sessions');
    const rows = (await listRes.json()) as Array<{ id: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('01HTEST0000000000000000ABC');
  });

  test('GET /api/app/summary returns aggregates', async () => {
    const res = await request(server, adminCookie, '/api/app/summary');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sessions: { total: number; active: number; latestId: string | null };
      upstreams: { total: number; enabled: number };
    };
    expect(body.sessions.total).toBe(0);
    expect(body.upstreams.total).toBe(0);
  });

  test('GET /api/app/cache/stats returns placeholder zeros', async () => {
    const res = await request(server, adminCookie, '/api/app/cache/stats');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokensSavedToday: number; entriesTotal: number };
    expect(body.tokensSavedToday).toBe(0);
    expect(body.entriesTotal).toBe(0);
  });

  test('GET /api/app/cache/entries returns empty list', async () => {
    const res = await request(server, adminCookie, '/api/app/cache/entries');
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body).toEqual([]);
  });

  test('POST /api/app/mcp-servers registers a server', async () => {
    const res = await request(server, adminCookie, '/api/app/mcp-servers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'test-server',
        transport: 'stdio',
        command: 'echo',
        args: ['hi'],
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name: string; enabled: boolean };
    expect(body.name).toBe('test-server');
    expect(body.enabled).toBe(true);
  });

  test('GET /api/app/settings returns defaults', async () => {
    const res = await request(server, adminCookie, '/api/app/settings');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { themeMode: string; density: string };
    expect(body.themeMode).toBe('system');
    expect(body.density).toBe('comfortable');
  });

  test('PATCH /api/app/settings updates themeMode', async () => {
    const res = await request(server, adminCookie, '/api/app/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ themeMode: 'dark' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { themeMode: string };
    expect(body.themeMode).toBe('dark');
  });

  test('GET /api/v1/status returns version', async () => {
    const res = await request(server, adminCookie, '/api/v1/status');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string };
    expect(body.version).toBe('test');
  });

  test('GET /api/v1/mcp-servers returns empty list', async () => {
    const res = await request(server, adminCookie, '/api/v1/mcp-servers');
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body).toEqual([]);
  });

  test('POST /api/v1/hooks/session-end closes a session', async () => {
    await request(server, adminCookie, '/api/v1/hooks/session-start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: '01HTEST0000000000000000DEF',
        source: 'claude-code',
        agent: 'Claude',
        startedAt: '2026-04-21T00:00:00.000Z',
      }),
    });
    const res = await request(server, adminCookie, '/api/v1/hooks/session-end', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: '01HTEST0000000000000000DEF',
        status: 'completed',
        endedAt: '2026-04-21T01:00:00.000Z',
      }),
    });
    expect(res.status).toBe(200);
  });

  test('uses mcpPlugin when provided instead of placeholder', async () => {
    const handle = createTempDatabaseHandle();
    const db = createDatabase({ filename: handle.databasePath });
    await runMigrations(db);

    const bus = createEventBus();
    const mcpPlugin = new Elysia().get('/mcp', () => ({ mocked: true })) as unknown as Elysia;
    const settingsService = createSettingsService({ db });
    const appApi = createAppApi({
      db,
      bus,
      auth: makeAuth(db, settingsService),
      statusService: createStatusService({ db, version: 'test', startedAt: Date.now() }),
      mcpRegistryService: createMcpRegistryService({ db }),
      settingsService,
      sessionService: createSessionService({ db, bus }),
    });

    const s = createPrismServer({
      appApi,
      statusService: createStatusService({ db, version: 'test', startedAt: Date.now() }),
      mcpPlugin,
    });

    const res = await s.handle(new Request('http://local/mcp'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mocked: boolean };
    expect(body.mocked).toBe(true);

    await closeDatabase(db);
    handle.cleanup();
  });

  test('serves dashboard asset when webAssets is provided', async () => {
    const handle = createTempDatabaseHandle();
    const db = createDatabase({ filename: handle.databasePath });
    await runMigrations(db);

    const bus = createEventBus();
    const htmlBytes = new TextEncoder().encode('<html></html>');
    const fakeAssets: ReadonlyMap<string, WebAsset> = new Map([
      ['index.html', { path: 'index.html', contentType: 'text/html', bytes: htmlBytes }],
    ]);
    const settingsService = createSettingsService({ db });
    const appApi = createAppApi({
      db,
      bus,
      auth: makeAuth(db, settingsService),
      statusService: createStatusService({ db, version: 'test', startedAt: Date.now() }),
      mcpRegistryService: createMcpRegistryService({ db }),
      settingsService,
      sessionService: createSessionService({ db, bus }),
    });

    const s = createPrismServer({
      appApi,
      statusService: createStatusService({ db, version: 'test', startedAt: Date.now() }),
      webAssets: fakeAssets,
      dashboardBasePath: '/dashboard',
    });

    const res = await s.handle(new Request('http://local/dashboard'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html');

    await closeDatabase(db);
    handle.cleanup();
  });

  test('starts and stops the server', async () => {
    const handle = createTempDatabaseHandle();
    const db = createDatabase({ filename: handle.databasePath });
    await runMigrations(db);

    const bus = createEventBus();
    const settingsService = createSettingsService({ db });
    const appApi = createAppApi({
      db,
      bus,
      auth: makeAuth(db, settingsService),
      statusService: createStatusService({ db, version: 'test', startedAt: Date.now() }),
      mcpRegistryService: createMcpRegistryService({ db }),
      settingsService,
      sessionService: createSessionService({ db, bus }),
    });

    const s = createPrismServer({
      appApi,
      statusService: createStatusService({ db, version: 'test', startedAt: Date.now() }),
    });

    const instance = await listen(s, { host: '127.0.0.1', port: 0 });
    expect(instance.host).toBe('127.0.0.1');
    expect(typeof instance.port).toBe('number');
    await instance.stop();

    await closeDatabase(db);
    handle.cleanup();
  });
});
