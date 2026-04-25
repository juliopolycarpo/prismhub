import { listSessions } from '@prismhub/db';
import type { AppApiDeps } from '../index.ts';
import { Elysia } from 'elysia';

export function createSummaryRoutes(
  deps: Pick<AppApiDeps, 'db' | 'statusService' | 'mcpRegistryService'>,
) {
  return new Elysia().get('/summary', async () => {
    const [status, upstreams, recent] = await Promise.all([
      deps.statusService.snapshot(),
      deps.mcpRegistryService.list(),
      listSessions(deps.db, 200, 0),
    ]);
    const active = recent.filter((s) => s.status === 'active');
    return {
      version: status.version,
      uptimeSec: status.uptimeSec,
      sessions: {
        total: recent.length,
        active: active.length,
        latestId: active[0]?.id ?? recent[0]?.id ?? null,
      },
      upstreams: {
        total: upstreams.length,
        enabled: upstreams.filter((m) => m.enabled).length,
      },
    };
  });
}
