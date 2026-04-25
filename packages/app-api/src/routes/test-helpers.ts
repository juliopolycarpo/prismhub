import { createAuth, type AuthInstance } from '@prismhub/auth';
import type { RuntimeConfig } from '@prismhub/config';
import {
  createEventBus,
  createMcpRegistryService,
  createSessionService,
  createSettingsService,
  createStatusService,
} from '@prismhub/core';
import { closeDatabase, createDatabase, runMigrations } from '@prismhub/db';
import { createTempDatabaseHandle } from '@prismhub/testkit-base';
import { afterEach, beforeEach } from 'bun:test';
import { createAppApi, type AppApi, type AppApiDeps } from '../index.ts';

const TEST_AUTH_CONFIG: RuntimeConfig['auth'] = {
  secret: 'prismhub-test-only-secret-do-not-use-in-production-xxxxxxxxxxxxxxxx',
  baseUrl: 'http://local',
  trustedOrigins: ['http://local'],
};

export interface AppApiTestServices extends AppApiDeps {
  readonly auth: AuthInstance;
  readonly cleanup: () => Promise<void>;
}

export interface CreateAppApiTestServicesOptions {
  readonly version?: string;
  readonly now?: () => number;
}

export async function createAppApiTestServices(
  options: CreateAppApiTestServicesOptions = {},
): Promise<AppApiTestServices> {
  const handle = createTempDatabaseHandle();
  const db = createDatabase({ filename: handle.databasePath });
  await runMigrations(db);

  const now = options.now ?? (() => Date.now());
  const bus = createEventBus();
  const sessionService = createSessionService({ db, bus });
  const mcpRegistryService = createMcpRegistryService({ db });
  const settingsService = createSettingsService({ db });
  const statusService = createStatusService({
    db,
    version: options.version ?? 'test',
    startedAt: now(),
    now,
  });
  const auth = createAuth({
    db,
    settingsService,
    config: { env: 'test', auth: TEST_AUTH_CONFIG } as unknown as RuntimeConfig,
  });

  return {
    db,
    bus,
    auth,
    sessionService,
    mcpRegistryService,
    settingsService,
    statusService,
    cleanup: async () => {
      await closeDatabase(db);
      handle.cleanup();
    },
  };
}

export function createTestAppApi(services: AppApiTestServices): AppApi {
  return createAppApi(services);
}

export function requestAppApi(app: AppApi, path: string, init?: RequestInit): Promise<Response> {
  return app.handle(new Request(`http://local${path}`, init));
}

export interface SignedInTestUser {
  readonly cookie: string;
  readonly headers: Record<string, string>;
  readonly role: string;
}

interface SignUpBody {
  readonly token: string;
  readonly user: { readonly id: string; readonly email: string; readonly role?: string };
}

/**
 * Creates the very first user (auto-promoted to admin) on a fresh services bundle
 * and returns the cookie/headers needed to make authenticated requests against
 * the app API.
 */
export async function bootstrapAdminAndSignIn(
  services: Pick<AppApiTestServices, 'auth'>,
  options: { readonly email?: string; readonly password?: string } = {},
): Promise<SignedInTestUser> {
  const email = options.email ?? 'admin@prismhub.test';
  const password = options.password ?? 'admin-test-password';
  const res = await services.auth.api.signUpEmail({
    body: { email, password, name: 'Admin' },
    asResponse: true,
  });
  if (res.status !== 200) {
    throw new Error(`bootstrapAdminAndSignIn failed: HTTP ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookie = setCookie.split(';')[0] ?? '';
  if (!cookie) throw new Error('missing set-cookie on sign-up response');
  const body = (await res.json()) as SignUpBody;
  return {
    cookie,
    headers: { cookie },
    role: body.user.role ?? 'admin',
  };
}

export interface AuthedAppApiClient {
  readonly services: AppApiTestServices;
  readonly appApi: AppApi;
  readonly cookie: string;
  /** Makes a request with the admin cookie attached unless `init.headers.cookie` is set. */
  request(path: string, init?: RequestInit): Promise<Response>;
  /** Makes a request without any cookie (for testing 401s). */
  requestUnauthed(path: string, init?: RequestInit): Promise<Response>;
}

/**
 * One-shot factory: creates services, mounts the app API, bootstraps an admin
 * user, and returns a client whose `request()` is pre-authenticated.
 */
export async function createAuthedAppApiClient(
  options: CreateAppApiTestServicesOptions = {},
): Promise<AuthedAppApiClient> {
  const services = await createAppApiTestServices(options);
  const appApi = createTestAppApi(services);
  const { cookie } = await bootstrapAdminAndSignIn(services);

  return {
    services,
    appApi,
    cookie,
    request: (path, init) => {
      const headers = new Headers(init?.headers);
      if (!headers.has('cookie')) headers.set('cookie', cookie);
      return requestAppApi(appApi, path, { ...init, headers });
    },
    requestUnauthed: (path, init) => requestAppApi(appApi, path, init),
  };
}

function requireAuthedClient(client: AuthedAppApiClient | undefined): AuthedAppApiClient {
  if (client) return client;
  throw new Error('Authed app API client is not initialized for this test.');
}

export function useAuthedAppApiClient(
  options: CreateAppApiTestServicesOptions = {},
): () => AuthedAppApiClient {
  let client: AuthedAppApiClient | undefined;

  beforeEach(async () => {
    client = await createAuthedAppApiClient(options);
  });

  afterEach(async () => {
    const currentClient = requireAuthedClient(client);
    client = undefined;
    await currentClient.services.cleanup();
  });

  return () => requireAuthedClient(client);
}
