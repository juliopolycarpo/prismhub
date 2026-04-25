import { listMcpServers, type PrismDatabase } from '@prismhub/db';
import type { StatusService, StatusSnapshot } from './status-service.types.ts';

export interface StatusServiceDeps {
  readonly db: PrismDatabase;
  readonly version: string;
  readonly startedAt: number;
  readonly now?: () => number;
}

export function createStatusService(deps: StatusServiceDeps): StatusService {
  const now = deps.now ?? (() => Date.now());
  return {
    async snapshot(): Promise<StatusSnapshot> {
      let dbReady = true;
      let upstreamsCount = 0;
      try {
        const rows = await listMcpServers(deps.db);
        upstreamsCount = rows.length;
      } catch {
        dbReady = false;
      }
      return {
        version: deps.version,
        uptimeSec: Math.floor((now() - deps.startedAt) / 1000),
        dbReady,
        upstreamsCount,
      };
    },
  };
}
