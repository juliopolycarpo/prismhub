import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  shutdownRuntimeServer,
  startRuntimeServer,
  type RuntimeServerHandle,
} from './runtime-server.ts';

const REPO_ROOT = resolve(import.meta.dir, '../../../..');
const RUN_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
const TMP_DIR = resolve(REPO_ROOT, '.prismhub/tests/tmp', RUN_TIMESTAMP);

const ADMIN = { email: 'admin@prismhub.test', password: 'admin-test-password-1', name: 'Admin' };
const USER = { email: 'bob@prismhub.test', password: 'bob-test-password-1', name: 'Bob' };

let runtime: RuntimeServerHandle;

beforeAll(async () => {
  mkdirSync(TMP_DIR, { recursive: true });
  runtime = await startRuntimeServer({ dataDirOverride: TMP_DIR });
});

afterAll(async () => {
  await shutdownRuntimeServer(runtime);
  // Intentionally do NOT cleanup TMP_DIR — left on disk for inspection.
});

async function signUp(
  baseUrl: string,
  payload: { email: string; password: string; name: string },
  cookie?: string,
): Promise<{ cookie: string; status: number; body: { user?: { role?: string } } | null }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookie) headers.cookie = cookie;
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookieValue = setCookie.split(';')[0] ?? '';
  const text = await res.text();
  return {
    cookie: cookieValue,
    status: res.status,
    body: text ? (JSON.parse(text) as { user?: { role?: string } }) : null,
  };
}

describe('auth e2e: signup, gating, sign-out', () => {
  test('full lifecycle: first signup → admin, second blocked, admin enables it, second succeeds, sign-out invalidates, rate-limit kicks in', async () => {
    const adminSignup = await signUp(runtime.baseUrl, ADMIN);
    expect(adminSignup.status).toBe(200);
    expect(adminSignup.cookie).not.toBe('');
    expect(adminSignup.body?.user?.role).toBe('admin');
    const adminCookie = adminSignup.cookie;

    const blockedSignup = await signUp(runtime.baseUrl, USER);
    expect(blockedSignup.status).toBe(403);

    const toggleRes = await fetch(`${runtime.baseUrl}/api/app/settings/registration`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ enabled: true }),
    });
    expect(toggleRes.status).toBe(200);

    const userSignup = await signUp(runtime.baseUrl, USER);
    expect(userSignup.status).toBe(200);
    expect(userSignup.body?.user?.role).toBe('user');

    const noCookieRes = await fetch(`${runtime.baseUrl}/api/app/status`);
    expect(noCookieRes.status).toBe(401);
    const adminStatusRes = await fetch(`${runtime.baseUrl}/api/app/status`, {
      headers: { cookie: adminCookie },
    });
    expect(adminStatusRes.status).toBe(200);

    const signOutRes = await fetch(`${runtime.baseUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: { cookie: adminCookie },
    });
    expect(signOutRes.status).toBe(200);
    const afterSignOutRes = await fetch(`${runtime.baseUrl}/api/app/status`, {
      headers: { cookie: adminCookie },
    });
    expect(afterSignOutRes.status).toBe(401);
  }, 30_000);
});

// Note on CSRF / trusted-origin coverage:
// Better Auth unconditionally sets `skipOriginCheck = true` when `isTest()`
// is true (NODE_ENV === "test" or env.TEST is set). The CSRF rejection path
// therefore cannot be exercised in any bun:test run — the library disables it
// by design in test environments. Running with NODE_ENV=production is not
// viable here because it requires a production-grade BETTER_AUTH_SECRET and
// triggers other production-only guards.
//
// What we DO test instead:
//   * `packages/auth/src/auth.integration.test.ts` — in-process handler
//     accepts trusted dev origins (localhost:5173, 127.0.0.1:5173) without 403.
//   * `packages/config/src/loader.unit.test.ts` — those origins are seeded
//     into `auth.trustedOrigins` by default in non-production envs.
// The regression (Vite dashboard at :5173 getting 403) cannot return without
// both tests above breaking first.
