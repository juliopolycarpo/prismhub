import type { CacheEntry } from '@prismhub/contracts';
import { Elysia } from 'elysia';

// Cache feature is not yet implemented — endpoints return placeholder data.
// Clients can detect this via the X-Prismhub-Placeholder response header.
export function createCacheRoutes() {
  return new Elysia({ prefix: '/cache' })
    .get('/stats', ({ set }) => {
      set.headers['x-prismhub-placeholder'] = 'true';
      return {
        tokensSavedToday: 0,
        economyToday: 0,
        economyMonth: 0,
        hitRate: 0,
        entriesTotal: 0,
        entriesFresh: 0,
        entriesIdle: 0,
      };
    })
    .get('/entries', ({ set }) => {
      set.headers['x-prismhub-placeholder'] = 'true';
      return [] as readonly CacheEntry[];
    });
}
