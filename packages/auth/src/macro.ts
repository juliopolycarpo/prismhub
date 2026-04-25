import { Elysia } from 'elysia';
import type { AuthInstance, AuthSession, AuthUser } from './auth.ts';
import { USER_ROLES, readRole } from './roles.ts';

export interface AuthMacroContext {
  readonly user: AuthUser;
  readonly session: AuthSession['session'];
}

/**
 * Elysia plugin that exposes `requireAuth` and `requireAdmin` macros.
 *
 * Usage:
 *   .use(authMacros(auth))
 *   .get('/private', ({ user }) => user, { requireAuth: true })
 *   .patch('/admin-only', ({ user }) => user, { requireAdmin: true })
 *
 * Both macros return 401 if there's no session; `requireAdmin` additionally
 * returns 403 when the user is not an admin.
 */
export function authMacros(auth: AuthInstance) {
  return new Elysia({ name: 'prismhub-auth-macros' }).macro({
    requireAuth: {
      resolve: async ({ status, request }) => {
        const result = await auth.api.getSession({ headers: request.headers });
        if (!result) return status(401, { error: 'unauthorized' });
        return { user: result.user, session: result.session };
      },
    },
    requireAdmin: {
      resolve: async ({ status, request }) => {
        const result = await auth.api.getSession({ headers: request.headers });
        if (!result) return status(401, { error: 'unauthorized' });
        if (readRole(result.user) !== USER_ROLES.ADMIN) {
          return status(403, { error: 'forbidden' });
        }
        return { user: result.user, session: result.session };
      },
    },
  });
}
