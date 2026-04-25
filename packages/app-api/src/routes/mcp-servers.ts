import { RegisterMcpServerInputSchema, UpdateMcpServerInputSchema } from '@prismhub/contracts';
import type { AppApiDeps } from '../index.ts';
import { Elysia, t } from 'elysia';

export function createMcpServerRoutes(deps: Pick<AppApiDeps, 'mcpRegistryService'>) {
  return new Elysia({ prefix: '/mcp-servers' })
    .get('/', async () => deps.mcpRegistryService.list())
    .post('/', async ({ body }) => deps.mcpRegistryService.register(body), {
      body: RegisterMcpServerInputSchema,
    })
    .patch('/:id', async ({ params, body }) => deps.mcpRegistryService.update(params.id, body), {
      params: t.Object({ id: t.String() }),
      body: UpdateMcpServerInputSchema,
    })
    .get('/:id/tools', async ({ params }) => deps.mcpRegistryService.listTools(params.id), {
      params: t.Object({ id: t.String() }),
    });
}
