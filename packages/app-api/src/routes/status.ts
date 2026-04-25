import type { AppApiDeps } from '../index.ts';
import { Elysia } from 'elysia';

export function createAppStatusRoutes(deps: Pick<AppApiDeps, 'statusService'>) {
  return new Elysia().get('/status', async () => deps.statusService.snapshot());
}
