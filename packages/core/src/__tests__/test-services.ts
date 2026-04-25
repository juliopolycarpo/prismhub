import { createTempDatabaseHandle } from '@prismhub/testkit-base';
import { closeDatabase, createDatabase, runMigrations, type PrismDatabase } from '@prismhub/db';
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
} from '../index.ts';

export interface CoreTestServices {
  readonly db: PrismDatabase;
  readonly bus: EventBus;
  readonly sessionService: SessionService;
  readonly mcpRegistryService: McpRegistryService;
  readonly settingsService: SettingsService;
  readonly statusService: StatusService;
  readonly cleanup: () => Promise<void>;
}

export interface CreateCoreTestServicesOptions {
  readonly version?: string;
  readonly now?: () => number;
}

/**
 * Local bootstrap for core integration tests.
 *
 * Lives inside `packages/core` because `@prismhub/testkit` depends on `core`,
 * so importing it from here would create a circular package dependency.
 * The shared `@prismhub/testkit` mirrors this helper for cross-package use.
 */
export async function createCoreTestServices(
  options: CreateCoreTestServicesOptions = {},
): Promise<CoreTestServices> {
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

  return {
    db,
    bus,
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
