import { createAppApi } from '@prismhub/app-api';
import { createAuthPlugin } from '@prismhub/auth';
import { createPrismServer, type PrismServer } from '@prismhub/http-server';
import type { TestServices } from './services.ts';

/**
 * Builds a fully wired Elysia test server from a `TestServices` instance.
 * Mounts the auth plugin so /api/auth/* is reachable and /api/app/* is gated.
 *
 * @example
 * const services = await createTestServices();
 * const server = createTestServer(services);
 * const res = await server.handle(new Request('http://local/healthz'));
 */
export function createTestServer(services: TestServices): PrismServer {
  const appApi = createAppApi(services);
  const authPlugin = createAuthPlugin({ auth: services.auth });
  return createPrismServer({ appApi, statusService: services.statusService, authPlugin });
}
