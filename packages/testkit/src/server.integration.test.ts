import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { bootstrapAdmin } from './auth.ts';
import { createTestServices, type TestServices } from './services.ts';
import { createTestServer } from './server.ts';

describe('createTestServer()', () => {
  let services: TestServices;

  beforeEach(async () => {
    services = await createTestServices();
  });

  afterEach(async () => {
    await services.cleanup();
  });

  test('returns Elysia server with handle() function', () => {
    const server = createTestServer(services);

    expect(server).toBeDefined();
    expect(typeof server.handle).toBe('function');
  });

  test('responds to status request with session cookie', async () => {
    const server = createTestServer(services);
    const { cookie } = await bootstrapAdmin(services.auth);

    const response = await server.handle(
      new Request('http://local/api/app/status', { headers: { cookie } }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { dbReady?: boolean; version?: string };
    expect(body.dbReady).toBe(true);
    expect(body.version).toBe('test');
  });

  test('returns 401 on /api/app/status without session cookie', async () => {
    const server = createTestServer(services);

    const response = await server.handle(new Request('http://local/api/app/status'));

    expect(response.status).toBe(401);
  });
});
