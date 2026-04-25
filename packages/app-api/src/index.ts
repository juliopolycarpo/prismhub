import type { AuthInstance } from '@prismhub/auth';
import { authMacros } from '@prismhub/auth';
import type {
  EventBus,
  McpRegistryService,
  SessionService,
  SettingsService,
  StatusService,
} from '@prismhub/core';
import type { PrismDatabase } from '@prismhub/db';
import { Elysia } from 'elysia';
import { createCacheRoutes } from './routes/cache.ts';
import { createFeedRoutes } from './routes/feed.ts';
import { createHookRoutes } from './routes/hooks.ts';
import { createMcpServerRoutes } from './routes/mcp-servers.ts';
import { createPublicStatusRoutes } from './routes/public-status.ts';
import { createSessionRoutes } from './routes/sessions.ts';
import { createSettingsRoutes } from './routes/settings.ts';
import { createAppStatusRoutes } from './routes/status.ts';
import { createSummaryRoutes } from './routes/summary.ts';

export interface AppApiDeps {
  readonly db: PrismDatabase;
  readonly bus: EventBus;
  readonly auth: AuthInstance;
  readonly statusService: StatusService;
  readonly mcpRegistryService: McpRegistryService;
  readonly settingsService: SettingsService;
  readonly sessionService: SessionService;
}

export function createAppApi(deps: AppApiDeps) {
  return new Elysia()
    .use(
      new Elysia({ prefix: '/api/app' })
        .use(authMacros(deps.auth))
        .guard({ requireAuth: true }, (app) =>
          app
            .use(createAppStatusRoutes(deps))
            .use(createSummaryRoutes(deps))
            .use(createSessionRoutes(deps))
            .use(createMcpServerRoutes(deps))
            .use(createSettingsRoutes(deps))
            .use(createCacheRoutes())
            .use(createFeedRoutes(deps)),
        ),
    )
    .use(
      new Elysia({ prefix: '/api/v1' })
        .use(createPublicStatusRoutes(deps))
        .use(createHookRoutes(deps)),
    );
}

export type AppApi = ReturnType<typeof createAppApi>;
