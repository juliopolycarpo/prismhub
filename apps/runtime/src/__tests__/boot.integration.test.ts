import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  bootstrapAdminCookie,
  cleanupRuntimeServer,
  RUNTIME_SERVER_TEST_TIMEOUT_MS,
  shutdownRuntimeServer,
  startRuntimeServer,
  type RuntimeServerHandle,
} from '../testing/runtime-server.ts';

let runtime: RuntimeServerHandle;
let adminCookie: string;

beforeAll(async () => {
  runtime = await startRuntimeServer();
  adminCookie = await bootstrapAdminCookie(runtime.baseUrl);
}, RUNTIME_SERVER_TEST_TIMEOUT_MS);

afterAll(async () => {
  await shutdownRuntimeServer(runtime);
  cleanupRuntimeServer(runtime);
}, RUNTIME_SERVER_TEST_TIMEOUT_MS);

describe('boot smoke test', () => {
  test('GET /healthz returns ok', async () => {
    const res = await fetch(`${runtime.baseUrl}/healthz`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true });
  });

  test('GET /readyz returns ok when DB is ready', async () => {
    const res = await fetch(`${runtime.baseUrl}/readyz`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, dbReady: true });
  });

  test('GET /api/app/status returns 401 without auth', async () => {
    const res = await fetch(`${runtime.baseUrl}/api/app/status`);
    expect(res.status).toBe(401);
  });

  test('GET /api/app/status returns snapshot when authenticated', async () => {
    const res = await fetch(`${runtime.baseUrl}/api/app/status`, {
      headers: { cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('dbReady');
    expect(body).toHaveProperty('upstreamsCount');
  });

  test('GET /api/app/cache/stats returns placeholder with header', async () => {
    const res = await fetch(`${runtime.baseUrl}/api/app/cache/stats`, {
      headers: { cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-prismhub-placeholder')).toBe('true');
  });

  test('pidfile is created at startup with correct metadata', async () => {
    const pidPath = `${runtime.tempDir.path}/prismhub.pid`;
    const text = await Bun.file(pidPath)
      .text()
      .catch(() => null);
    expect(text).not.toBeNull();
    const record = JSON.parse(text!);
    expect(record).toMatchObject({
      host: runtime.host,
      port: runtime.port,
    });
    expect(typeof record.pid).toBe('number');
  });

  test('SIGTERM removes pidfile before exit', async () => {
    await shutdownRuntimeServer(runtime);
    const pidPath = `${runtime.tempDir.path}/prismhub.pid`;
    const exists = await Bun.file(pidPath).exists();
    expect(exists).toBe(false);
  });
});
