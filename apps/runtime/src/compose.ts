import type { RuntimeConfig } from '@prismhub/config';
import { loadConfig } from '@prismhub/config';
import type { McpToolSummary } from '@prismhub/contracts';
import { createAuth, type AuthInstance } from '@prismhub/auth';
import {
  createEventBus,
  createMcpRegistryService,
  createSessionService,
  createSettingsService,
  createStatusService,
  type DiscoverServerTools,
  type EventBus,
  type McpRegistryService,
  type SessionService,
  type SettingsService,
  type StatusService,
} from '@prismhub/core';
import { closeDatabase, createDatabase, type PrismDatabase, runMigrations } from '@prismhub/db';
import { createMcpClientPool, type McpClientPool, type UpstreamTarget } from '@prismhub/mcp-client';
import { createLogger, type Logger } from '@prismhub/observability';

export interface PrismServices {
  readonly config: RuntimeConfig;
  readonly logger: Logger;
  readonly db: PrismDatabase;
  readonly bus: EventBus;
  readonly auth: AuthInstance;
  readonly sessionService: SessionService;
  readonly mcpRegistryService: McpRegistryService;
  readonly mcpClientPool: McpClientPool;
  readonly settingsService: SettingsService;
  readonly statusService: StatusService;
  readonly shutdown: () => Promise<void>;
}

export interface ComposeOptions {
  readonly version: string;
  readonly serviceName?: string;
  /** Override the clock used for `startedAt`. Useful in tests. */
  readonly now?: () => number;
  /** Override the logger. Useful in tests. */
  readonly logger?: Logger;
}

function buildDiscoverTools(pool: McpClientPool): DiscoverServerTools {
  return async (server) => {
    const target = serverToTarget(server);
    if (!target) throw new Error(`upstream ${server.id} has no resolvable target`);
    const connection = await pool.connect(target);
    const result = await connection.client.listTools();
    return result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? null,
      inputSchema: (tool.inputSchema as McpToolSummary['inputSchema']) ?? null,
    }));
  };
}

function serverToTarget(server: {
  readonly id: string;
  readonly name: string;
  readonly transport: 'stdio' | 'http';
  readonly command: string | null;
  readonly args: readonly string[] | null;
  readonly url: string | null;
  readonly headers: Readonly<Record<string, string>> | null;
}): UpstreamTarget | null {
  if (server.transport === 'stdio') {
    if (!server.command) return null;
    return {
      id: server.id,
      name: server.name,
      transport: 'stdio',
      command: server.command,
      args: server.args ?? [],
    };
  }
  if (!server.url) return null;
  const target: UpstreamTarget = {
    id: server.id,
    name: server.name,
    transport: 'http',
    url: new URL(server.url),
    ...(server.headers ? { headers: server.headers } : {}),
  };
  return target;
}

export async function composeServices(options: ComposeOptions): Promise<PrismServices> {
  const config = loadConfig();
  const logger =
    options.logger ??
    createLogger({
      level: config.logging.level,
      stdioSafe: config.logging.stdioSafe,
      serviceName: options.serviceName ?? 'prismhub',
    });

  const db = createDatabase({ filename: config.paths.databasePath });
  await runMigrations(db);

  const now = options.now ?? (() => Date.now());
  const bus = createEventBus();
  const sessionService = createSessionService({ db, bus });
  const mcpClientPool = createMcpClientPool({ logger });
  const mcpRegistryService = createMcpRegistryService({
    db,
    discoverTools: buildDiscoverTools(mcpClientPool),
  });
  const settingsService = createSettingsService({ db });
  const statusService = createStatusService({
    db,
    version: options.version,
    startedAt: now(),
  });
  const auth = createAuth({ db, config, settingsService });

  return {
    config,
    logger,
    db,
    bus,
    auth,
    sessionService,
    mcpRegistryService,
    mcpClientPool,
    settingsService,
    statusService,
    shutdown: async () => {
      await mcpClientPool.closeAll().catch((err: unknown) => {
        logger.warn('failed to close mcp client pool cleanly', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
      await closeDatabase(db);
    },
  };
}
