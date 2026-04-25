import { createAuth, createAuthPlugin, type AuthInstance } from '@prismhub/auth';
import type { RuntimeConfig } from '@prismhub/config';
import { type Elysia } from 'elysia';
import type { TestServices } from './services.ts';

const TEST_AUTH_CONFIG: RuntimeConfig['auth'] = {
  secret: 'prismhub-test-only-secret-do-not-use-in-production-xxxxxxxxxxxxxxxx',
  baseUrl: 'http://local',
  trustedOrigins: ['http://local'],
};

/**
 * Builds a Better Auth instance bound to a test services bundle.
 *
 * Uses a fixed test secret and a `http://local` base URL — matching the host
 * used by `requestAppApi`/`server.handle()` test helpers.
 */
export function createTestAuth(
  services: Pick<TestServices, 'db' | 'settingsService'>,
): AuthInstance {
  return createAuth({
    db: services.db,
    settingsService: services.settingsService,
    config: { env: 'test', auth: TEST_AUTH_CONFIG } as unknown as RuntimeConfig,
  });
}

/** Mounts the auth plugin onto a fresh Elysia app for tests that only need /api/auth. */
export function createTestAuthPlugin(auth: AuthInstance): Elysia {
  return createAuthPlugin({ auth });
}

export interface TestUserCredentials {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
}

export interface SignedInUser {
  readonly cookie: string;
  readonly headers: Headers;
  readonly user: { readonly id: string; readonly email: string; readonly role: string };
  readonly token: string;
}

const DEFAULT_ADMIN: TestUserCredentials = {
  email: 'admin@prismhub.test',
  password: 'admin-test-password',
  name: 'Admin',
};

/**
 * Creates the very first user in a fresh database. Because Prismhub auto-promotes
 * the first user to `admin`, the returned `user.role` is `'admin'`.
 */
export async function bootstrapAdmin(
  auth: AuthInstance,
  options: Partial<TestUserCredentials> = {},
): Promise<SignedInUser> {
  const credentials = { ...DEFAULT_ADMIN, ...options };
  const res = await auth.api.signUpEmail({
    body: {
      email: credentials.email,
      password: credentials.password,
      name: credentials.name ?? credentials.email,
    },
    asResponse: true,
  });
  if (res.status !== 200) {
    throw new Error(`bootstrapAdmin failed: HTTP ${res.status} ${await res.text()}`);
  }
  return readSignedInResponse(res);
}

/**
 * Signs in an existing user and returns headers/cookie for authenticated requests.
 */
export async function signInTestUser(
  auth: AuthInstance,
  credentials: TestUserCredentials,
): Promise<SignedInUser> {
  const res = await auth.api.signInEmail({
    body: { email: credentials.email, password: credentials.password },
    asResponse: true,
  });
  if (res.status !== 200) {
    throw new Error(`signInTestUser failed: HTTP ${res.status} ${await res.text()}`);
  }
  return readSignedInResponse(res);
}

interface SignInResponseBody {
  readonly token: string;
  readonly user: { readonly id: string; readonly email: string; readonly role?: string };
}

async function readSignedInResponse(res: Response): Promise<SignedInUser> {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) throw new Error('auth response missing set-cookie header');
  const cookie = setCookie.split(';')[0] ?? '';
  if (!cookie) throw new Error('failed to parse cookie from set-cookie header');

  const body = (await res.json()) as SignInResponseBody;
  return {
    cookie,
    headers: new Headers({ cookie }),
    token: body.token,
    user: {
      id: body.user.id,
      email: body.user.email,
      role: body.user.role ?? 'user',
    },
  };
}
