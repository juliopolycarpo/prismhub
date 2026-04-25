import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { loadConfig, type RuntimeConfig } from '@prismhub/config';
import { createSettingsService, type SettingsService } from '@prismhub/core';
import {
  closeDatabase,
  countUsers,
  createDatabase,
  findUserByEmail,
  runMigrations,
  type PrismDatabase,
} from '@prismhub/db';
import { createTempDatabaseHandle, type TempDatabaseHandle } from '@prismhub/testkit-base';
import { createAuth, type AuthInstance } from './auth.ts';

let handle: TempDatabaseHandle;
let db: PrismDatabase;
let auth: AuthInstance;
let settingsService: SettingsService;
let config: RuntimeConfig;

const baseEnv = (overrides: Record<string, string | undefined> = {}) => ({
  get: (name: string) => overrides[name],
});

beforeEach(async () => {
  handle = createTempDatabaseHandle();
  db = createDatabase({ filename: handle.databasePath });
  await runMigrations(db);
  settingsService = createSettingsService({ db });
  config = loadConfig(baseEnv({ NODE_ENV: 'test' }));
  auth = createAuth({ db, config, settingsService });
});

afterEach(async () => {
  await closeDatabase(db);
  handle.cleanup();
});

async function signUp(email: string, password = 'super-secret-passphrase') {
  return auth.api.signUpEmail({
    body: { email, password, name: email.split('@')[0] ?? 'user' },
    asResponse: true,
  });
}

describe('bootstrap policy', () => {
  test('first user becomes admin', async () => {
    expect(await countUsers(db)).toBe(0);
    const res = await signUp('alice@example.com');
    expect(res.status).toBe(200);

    const user = await findUserByEmail(db, 'alice@example.com');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('admin');
  });

  test('second user rejected when registration disabled', async () => {
    await signUp('alice@example.com');
    const res = await signUp('bob@example.com');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await findUserByEmail(db, 'bob@example.com')).toBeNull();
  });

  test('second user created as user when registration enabled', async () => {
    await signUp('alice@example.com');
    await settingsService.update({ allowUserRegistration: true });

    const res = await signUp('bob@example.com');
    expect(res.status).toBe(200);
    const user = await findUserByEmail(db, 'bob@example.com');
    expect(user?.role).toBe('user');
  });
});

describe('session', () => {
  test('signing in returns a session cookie that resolves via getSession', async () => {
    await signUp('alice@example.com', 'super-secret-passphrase');
    const signInRes = await auth.api.signInEmail({
      body: { email: 'alice@example.com', password: 'super-secret-passphrase' },
      asResponse: true,
    });
    expect(signInRes.status).toBe(200);

    const cookie = signInRes.headers.get('set-cookie');
    expect(cookie).toBeTruthy();

    const session = await auth.api.getSession({
      headers: new Headers({ cookie: cookie ?? '' }),
    });
    expect(session?.user.email).toBe('alice@example.com');
  });
});

describe('CSRF / trusted origins (HTTP handler)', () => {
  // Regression for the bug where the Vite dashboard (http://localhost:5173)
  // received 403 from /api/auth/sign-up/email because Better Auth rejected the
  // cross-origin POST. The fix is `trustedOrigins` seeded by the config loader.
  //
  // Better Auth's CSRF middleware enforces `trustedOrigins` whenever the
  // request carries Sec-Fetch-* metadata (always present in real browsers) OR
  // a Cookie header. We send Sec-Fetch-* to mirror real browser behavior —
  // without them the server skips validation entirely.
  //
  // Both paths (positive + negative) cannot be fully covered in bun:test
  // because better-auth sets `skipOriginCheck = true` whenever NODE_ENV === "test"
  // (or env.TEST is set). This disables CSRF checks at the library level,
  // making the negative path untestable in any bun:test environment — including
  // spawned child processes that inherit NODE_ENV=test.
  // Only the positive path is asserted here; it still guards against the
  // regression where the Vite dev origins were missing from `trustedOrigins`.
  function postSignUp(origin: string, email: string): Promise<Response> {
    const baseUrl = config.auth.baseUrl;
    return auth.handler(
      new Request(`${baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin,
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
        },
        body: JSON.stringify({ email, password: 'super-secret-passphrase', name: 'Alice' }),
      }),
    );
  }

  test('accepts signup from Vite dev origin (localhost:5173)', async () => {
    const res = await postSignUp('http://localhost:5173', 'alice@example.com');
    expect(res.status).toBe(200);
  });

  test('accepts signup from 127.0.0.1:5173', async () => {
    const res = await postSignUp('http://127.0.0.1:5173', 'bob@example.com');
    expect(res.status).toBe(200);
  });
});
