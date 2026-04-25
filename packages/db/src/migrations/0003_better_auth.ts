import { sql } from 'kysely';
import type { PrismDatabase } from '../client.ts';
import type { Migration } from './migration.types.ts';

/**
 * Adds the tables required by Better Auth (user, account, session, verification)
 * plus a rate_limit table for the built-in `storage: "database"` rate limiter.
 *
 * Column names are camelCase to match Better Auth's Kysely adapter defaults,
 * so no `fields` mapping is required in the auth config. This intentionally
 * differs from the snake_case convention used elsewhere in this DB.
 *
 * Note: the table name `session` (singular) does NOT conflict with our existing
 * `sessions` (plural) table — Better Auth sessions are user auth sessions,
 * while `sessions` tracks coding-tool sessions.
 */

async function createUserTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('user')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('emailVerified', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('image', 'text')
    .addColumn('role', 'text', (col) => col.notNull().defaultTo('user'))
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema.createIndex('user_email_idx').ifNotExists().on('user').column('email').execute();
}

async function createAccountTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('account')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('accountId', 'text', (col) => col.notNull())
    .addColumn('providerId', 'text', (col) => col.notNull())
    .addColumn('password', 'text')
    .addColumn('accessToken', 'text')
    .addColumn('refreshToken', 'text')
    .addColumn('idToken', 'text')
    .addColumn('accessTokenExpiresAt', 'text')
    .addColumn('refreshTokenExpiresAt', 'text')
    .addColumn('scope', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addForeignKeyConstraint('account_user_fk', ['userId'], 'user', ['id'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('account_user_idx')
    .ifNotExists()
    .on('account')
    .column('userId')
    .execute();
}

async function createAuthSessionTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('session')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('userId', 'text', (col) => col.notNull())
    .addColumn('token', 'text', (col) => col.notNull().unique())
    .addColumn('expiresAt', 'text', (col) => col.notNull())
    .addColumn('ipAddress', 'text')
    .addColumn('userAgent', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addForeignKeyConstraint('session_user_fk', ['userId'], 'user', ['id'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('session_token_idx')
    .ifNotExists()
    .on('session')
    .column('token')
    .execute();

  await db.schema
    .createIndex('session_user_idx')
    .ifNotExists()
    .on('session')
    .column('userId')
    .execute();
}

async function createVerificationTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('verification')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('identifier', 'text', (col) => col.notNull())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('expiresAt', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createIndex('verification_identifier_idx')
    .ifNotExists()
    .on('verification')
    .column('identifier')
    .execute();
}

async function createRateLimitTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('rateLimit')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('key', 'text', (col) => col.notNull())
    .addColumn('count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('lastRequest', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createIndex('rate_limit_key_idx')
    .ifNotExists()
    .on('rateLimit')
    .column('key')
    .execute();
}

async function addAllowUserRegistrationToSettings(db: PrismDatabase): Promise<void> {
  await db.schema
    .alterTable('settings')
    .addColumn('allow_user_registration', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();
}

export const migration0003BetterAuth: Migration = {
  name: '0003_better_auth',

  async up(db) {
    await createUserTable(db);
    await createAccountTable(db);
    await createAuthSessionTable(db);
    await createVerificationTable(db);
    await createRateLimitTable(db);
    await addAllowUserRegistrationToSettings(db);
  },

  async down(db) {
    await db.schema.alterTable('settings').dropColumn('allow_user_registration').execute();
    await db.schema.dropTable('rateLimit').ifExists().execute();
    await db.schema.dropTable('verification').ifExists().execute();
    await db.schema.dropTable('session').ifExists().execute();
    await db.schema.dropTable('account').ifExists().execute();
    await db.schema.dropTable('user').ifExists().execute();
  },
};
