import { countUsers } from '@prismhub/db';
import type { AppApiDeps } from '../index.ts';
import { Elysia } from 'elysia';

export function createPublicStatusRoutes(
  deps: Pick<AppApiDeps, 'statusService' | 'mcpRegistryService' | 'db' | 'settingsService'>,
) {
  return new Elysia()
    .get('/status', async () => deps.statusService.snapshot())
    .get('/mcp-servers', async () => {
      const servers = await deps.mcpRegistryService.list();
      return servers.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        transport: s.transport,
        enabled: s.enabled,
      }));
    })
    .get('/registration-status', async () => {
      const userCount = await countUsers(deps.db);
      const settings = await deps.settingsService.read();
      return {
        // True when no users exist yet — the next signup becomes admin.
        firstUser: userCount === 0,
        // True when signup is allowed: either the DB is empty (bootstrap) or
        // an admin has explicitly enabled public registration.
        registrationOpen: userCount === 0 || settings.allowUserRegistration,
      };
    });
}
