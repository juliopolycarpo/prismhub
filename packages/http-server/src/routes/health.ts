import type { StatusService } from '@prismhub/core';
import { Elysia } from 'elysia';
import { HTTP_STATUS } from './constants.ts';

export interface HealthRoutesDeps {
  readonly statusService: StatusService;
}

export function createHealthRoutes(deps: HealthRoutesDeps) {
  return new Elysia()
    .get('/healthz', () => ({ ok: true }))
    .get('/readyz', async ({ set }) => {
      const snapshot = await deps.statusService.snapshot();
      if (!snapshot.dbReady) {
        set.status = HTTP_STATUS.SERVICE_UNAVAILABLE;
        return { ok: false, dbReady: false };
      }
      return { ok: true, dbReady: true };
    });
}
