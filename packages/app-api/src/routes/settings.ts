import { UpdateSettingsInputSchema } from '@prismhub/contracts';
import type { AppApiDeps } from '../index.ts';
import { Elysia, t } from 'elysia';

export function createSettingsRoutes(deps: Pick<AppApiDeps, 'settingsService'>) {
  return new Elysia({ prefix: '/settings' })
    .get('/', async () => deps.settingsService.read())
    .patch('/', async ({ body }) => deps.settingsService.update(body), {
      body: UpdateSettingsInputSchema,
    })
    .patch(
      '/registration',
      async ({ body }) => deps.settingsService.update({ allowUserRegistration: body.enabled }),
      {
        requireAdmin: true,
        body: t.Object({ enabled: t.Boolean() }),
      },
    );
}
