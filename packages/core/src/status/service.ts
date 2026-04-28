import { countMcpServers, type PrismDatabase } from '@prismhub/db';

export interface StatusSnapshot {
  readonly version: string;
  readonly uptimeSec: number;
  readonly dbReady: boolean;
  readonly upstreamsCount: number;
}

export interface StatusService {
  readonly snapshot: () => Promise<StatusSnapshot>;
}

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
        upstreamsCount = await countMcpServers(deps.db);
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
