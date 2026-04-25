import { sql } from 'kysely';
import type { PrismDatabase } from '../client.ts';
import type { Migration } from './migration.types.ts';

const DEFAULT_THEME_MODE = 'system';
const DEFAULT_ACCENT_COLOR = '#F97316';
const DEFAULT_DENSITY = 'comfortable';

async function createSettingsTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('settings')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('theme_mode', 'text', (col) => col.notNull().defaultTo(DEFAULT_THEME_MODE))
    .addColumn('accent_color', 'text', (col) => col.notNull().defaultTo(DEFAULT_ACCENT_COLOR))
    .addColumn('density', 'text', (col) => col.notNull().defaultTo(DEFAULT_DENSITY))
    .addColumn('show_metadata', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db
    .insertInto('settings')
    .values({
      id: 1,
      theme_mode: DEFAULT_THEME_MODE,
      accent_color: DEFAULT_ACCENT_COLOR,
      density: DEFAULT_DENSITY,
      show_metadata: 1,
      updated_at: new Date().toISOString(),
    })
    .onConflict((oc) => oc.doNothing())
    .execute();
}

async function createMcpServersTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('mcp_servers')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('transport', 'text', (col) => col.notNull())
    .addColumn('command', 'text')
    .addColumn('args_json', 'text')
    .addColumn('url', 'text')
    .addColumn('enabled', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'text', (col) => col.notNull())
    .execute();
}

async function createMcpToolsTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('mcp_tools')
    .ifNotExists()
    .addColumn('server_id', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('input_schema_json', 'text')
    .addColumn('updated_at', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('mcp_tools_pk', ['server_id', 'name'])
    .execute();
}

async function createSessionsTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('sessions')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('agent', 'text', (col) => col.notNull())
    .addColumn('title', 'text')
    .addColumn('working_dir', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('started_at', 'text', (col) => col.notNull())
    .addColumn('ended_at', 'text')
    .addColumn('message_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('tool_call_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('metadata_json', 'text')
    .execute();

  await db.schema
    .createIndex('sessions_started_at_idx')
    .ifNotExists()
    .on('sessions')
    .column('started_at')
    .execute();
}

async function createSessionEventsTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('session_events')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('session_id', 'text', (col) => col.notNull())
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('payload_json', 'text', (col) => col.notNull())
    .addColumn('at', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addForeignKeyConstraint(
      'session_events_session_fk',
      ['session_id'],
      'sessions',
      ['id'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  await db.schema
    .createIndex('session_events_session_idx')
    .ifNotExists()
    .on('session_events')
    .columns(['session_id', 'at'])
    .execute();
}

async function createToolInvocationsTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('tool_invocations')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('session_id', 'text')
    .addColumn('server_id', 'text')
    .addColumn('tool_name', 'text', (col) => col.notNull())
    .addColumn('input_json', 'text', (col) => col.notNull())
    .addColumn('output_json', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('error', 'text')
    .addColumn('started_at', 'text', (col) => col.notNull())
    .addColumn('ended_at', 'text')
    .execute();
}

async function createAuditEventsTable(db: PrismDatabase): Promise<void> {
  await db.schema
    .createTable('audit_events')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('at', 'text', (col) => col.notNull())
    .addColumn('action', 'text', (col) => col.notNull())
    .addColumn('actor', 'text', (col) => col.notNull())
    .addColumn('target', 'text', (col) => col.notNull())
    .addColumn('details_json', 'text')
    .execute();
}

export const migration0001Init: Migration = {
  name: '0001_init',

  async up(db) {
    await createSettingsTable(db);
    await createMcpServersTable(db);
    await createMcpToolsTable(db);
    await createSessionsTable(db);
    await createSessionEventsTable(db);
    await createToolInvocationsTable(db);
    await createAuditEventsTable(db);
  },

  // Drop in reverse dependency order: events/audit first, then sessions, then servers.
  async down(db) {
    await db.schema.dropTable('audit_events').ifExists().execute();
    await db.schema.dropTable('tool_invocations').ifExists().execute();
    await db.schema.dropTable('session_events').ifExists().execute();
    await db.schema.dropTable('sessions').ifExists().execute();
    await db.schema.dropTable('mcp_tools').ifExists().execute();
    await db.schema.dropTable('mcp_servers').ifExists().execute();
    await db.schema.dropTable('settings').ifExists().execute();
  },
};
