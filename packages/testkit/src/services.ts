import {
  createEventBus,
  createMcpRegistryService,
  createSessionService,
  createSettingsService,
  createStatusService,
  type EventBus,
  type McpRegistryService,
  type SessionService,
  type SettingsService,
  type StatusService,
} from '@prismhub/core';
import type { AuthInstance } from '@prismhub/auth';
import { closeDatabase, createDatabase, runMigrations, type PrismDatabase } from '@prismhub/db';
import { createTempDatabaseHandle } from '@prismhub/testkit-base';
import { createTestAuth } from './auth.ts';

export interface TestServices {
  readonly db: PrismDatabase;
  readonly bus: EventBus;
  readonly auth: AuthInstance;
  readonly sessionService: SessionService;
  readonly mcpRegistryService: McpRegistryService;
  readonly settingsService: SettingsService;
  readonly statusService: StatusService;
  readonly cleanup: () => Promise<void>;
}

export interface CreateTestServicesOptions {
  readonly version?: string;
  readonly now?: () => number;
}

/** Lightweight { db, cleanup } bundle for DB-only tests that don't need full services. */
export async function createTestDatabase(): Promise<{
  readonly db: PrismDatabase;
  readonly cleanup: () => Promise<void>;
}> {
  const handle = createTempDatabaseHandle();
  const db = createDatabase({ filename: handle.databasePath });
  await runMigrations(db);
  return {
    db,
    cleanup: async () => {
      await closeDatabase(db);
      handle.cleanup();
    },
  };
}

/**
 * Bootstraps a fully wired set of services backed by an in-memory SQLite database.
 * Call `cleanup()` after each test to release the database file.
 *
 * @example
 * let services: TestServices;
 * beforeEach(async () => { services = await createTestServices(); });
 * afterEach(async () => { await services.cleanup(); });
 */
export async function createTestServices(
  options: CreateTestServicesOptions = {},
): Promise<TestServices> {
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
  const auth = createTestAuth({ db, settingsService });

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
      handle?.cleanup();
    },
  };
}
