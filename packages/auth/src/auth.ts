import type { RuntimeConfig } from '@prismhub/config';
import type { SettingsService } from '@prismhub/core';
import { countUsers, type PrismDatabase } from '@prismhub/db';
import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { RegistrationDisabledError } from './errors.ts';
import { hashPassword, verifyPassword } from './password.ts';
import { USER_ROLES } from './roles.ts';

export interface CreateAuthDeps {
  readonly db: PrismDatabase;
  readonly config: RuntimeConfig;
  readonly settingsService: SettingsService;
}

export type AuthInstance = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<Awaited<ReturnType<AuthInstance['api']['getSession']>>>;
export type AuthUser = AuthSession['user'];

/**
 * Build the Better Auth instance wired to Prismhub's Kysely DB, the runtime
 * config secrets, and the settings service for the registration policy.
 *
 * Policy:
 * - First user created becomes role="admin" (bootstrap).
 * - Subsequent sign-ups are rejected unless `allowUserRegistration === true`.
 *
 * Hashing: Argon2id via Bun.password (salt embedded in the PHC string).
 *
 * Rate limiting: stored in the `rateLimit` table; defaults from Better Auth
 * already cap sign-in/sign-up at 3 requests per 10s.
 */
export function createAuth(deps: CreateAuthDeps) {
  return betterAuth({
    appName: 'Prismhub',
    baseURL: deps.config.auth.baseUrl,
    secret: deps.config.auth.secret,
    trustedOrigins: [...deps.config.auth.trustedOrigins],
    database: kyselyAdapter(deps.db, { type: 'sqlite' }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: USER_ROLES.USER,
          input: false,
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
    },
    advanced: {
      useSecureCookies: deps.config.env === 'production',
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const existing = await countUsers(deps.db);
            if (existing === 0) {
              return { data: { ...user, role: USER_ROLES.ADMIN } };
            }
            const settings = await deps.settingsService.read();
            if (!settings.allowUserRegistration) {
              // Surface as a Better Auth APIError so the HTTP status is 403.
              // The thrown error is also captured by tests via `RegistrationDisabledError`
              // when calling auth.api.signUpEmail() directly.
              const domainError = new RegistrationDisabledError();
              throw new APIError('FORBIDDEN', {
                code: domainError.code,
                message: domainError.message,
              });
            }
            return { data: { ...user, role: USER_ROLES.USER } };
          },
        },
      },
    },
  });
}
