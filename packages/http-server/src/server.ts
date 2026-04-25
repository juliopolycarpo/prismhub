import type { AppApi } from '@prismhub/app-api';
import type { StatusService } from '@prismhub/core';
import type { WebAsset } from '@prismhub/web-assets';
import { Elysia } from 'elysia';
import { createDashboardRoutes } from './routes/dashboard.ts';
import { createHealthRoutes } from './routes/health.ts';
import { createMcpPlaceholderRoutes } from './routes/mcp-placeholder.ts';

export interface PrismServerDeps {
  readonly appApi: AppApi;
  readonly statusService: StatusService;
  readonly authPlugin?: Elysia;
  readonly mcpPlugin?: Elysia;
  readonly webAssets?: ReadonlyMap<string, WebAsset>;
  readonly dashboardBasePath?: string;
}

export function createPrismServer(deps: PrismServerDeps) {
  const app = new Elysia().use(createHealthRoutes(deps));
  if (deps.authPlugin) {
    app.use(deps.authPlugin);
  }
  if (deps.mcpPlugin) {
    app.use(deps.mcpPlugin);
  } else {
    app.use(createMcpPlaceholderRoutes());
  }
  if (deps.webAssets) {
    app.use(
      createDashboardRoutes({
        assets: deps.webAssets,
        basePath: deps.dashboardBasePath ?? '/dashboard',
      }),
    );
  }
  return app.use(deps.appApi);
}

export type PrismServer = ReturnType<typeof createPrismServer>;

export interface ListenOptions {
  readonly host: string;
  readonly port: number;
}

export interface ListeningServer {
  readonly host: string;
  readonly port: number;
  readonly stop: () => Promise<void>;
}

export async function listen(
  server: PrismServer,
  options: ListenOptions,
): Promise<ListeningServer> {
  const instance = server.listen({ hostname: options.host, port: options.port });
  return {
    host: options.host,
    port: options.port,
    stop: async () => {
      await instance.stop();
    },
  };
}
