import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { bootstrapAdmin, createTestAuth, createTestAuthPlugin, signInTestUser } from './auth.ts';
import { createTestServices, type TestServices } from './services.ts';
import { createTestServer } from './server.ts';
import type { AuthInstance } from '@prismhub/auth';
import { Elysia } from 'elysia';

describe('testkit auth helpers', () => {
  let services: TestServices;

  beforeEach(async () => {
    services = await createTestServices();
  });

  afterEach(async () => {
    await services.cleanup();
  });

  test('createTestAuth returns usable Better Auth instance', () => {
    const auth: AuthInstance = createTestAuth(services);
    expect(auth.api.signUpEmail).toBeInstanceOf(Function);
    expect(auth.api.signInEmail).toBeInstanceOf(Function);
  });

  test('bootstrapAdmin creates first user as admin', async () => {
    const result = await bootstrapAdmin(services.auth);
    expect(result.user.role).toBe('admin');
    expect(result.cookie).toMatch(/^better-auth\./);
  });

  test('signInTestUser returns fresh cookie for existing user', async () => {
    await bootstrapAdmin(services.auth);

    const signedIn = await signInTestUser(services.auth, {
      email: 'admin@prismhub.test',
      password: 'admin-test-password',
    });

    expect(signedIn.user.email).toBe('admin@prismhub.test');
    expect(signedIn.cookie).toMatch(/^better-auth\./);
  });

  test('createTestAuthPlugin handles /api/auth/sign-up/email', async () => {
    const plugin = createTestAuthPlugin(services.auth);
    const app = new Elysia().use(plugin);

    const res = await app.handle(
      new Request('http://local/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'first@prismhub.test',
          password: 'first-user-password',
          name: 'First',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { role?: string } };
    expect(body.user.role).toBe('admin');
  });

  test('admin cookie authorizes /api/app/status through createTestServer', async () => {
    const { cookie } = await bootstrapAdmin(services.auth);
    const server = createTestServer(services);

    const res = await server.handle(
      new Request('http://local/api/app/status', { headers: { cookie } }),
    );

    expect(res.status).toBe(200);
  });
});
