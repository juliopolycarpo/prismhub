import { Elysia } from 'elysia';
import type { AuthInstance } from './auth.ts';

export interface CreateAuthPluginDeps {
  readonly auth: AuthInstance;
}

/**
 * Mount the Better Auth handler at /api/auth/*.
 *
 * Better Auth's basePath default is /api/auth, so we delegate any request
 * matching that prefix to `auth.handler` and let it dispatch internally.
 */
export function createAuthPlugin(deps: CreateAuthPluginDeps): Elysia {
  const handler = deps.auth.handler;
  // Cast to bare Elysia: the inferred typed-route shape from `.all()` would leak
  // into PrismServerDeps.authPlugin?: Elysia and break exactOptionalPropertyTypes.
  return new Elysia({ name: 'prismhub-auth' }).all('/api/auth/*', ({ request }) =>
    handler(request),
  ) as unknown as Elysia;
}

export type AuthPlugin = Elysia;
