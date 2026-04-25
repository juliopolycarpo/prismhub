import type { Migration } from './migration.types.ts';

/**
 * Adds `headers_json` to `mcp_servers` so HTTP-transport upstreams can persist
 * request headers (Authorization, custom auth tokens, etc.).
 */
export const migration0002McpHeaders: Migration = {
  name: '0002_mcp_headers',

  async up(db) {
    await db.schema.alterTable('mcp_servers').addColumn('headers_json', 'text').execute();
  },

  async down(db) {
    await db.schema.alterTable('mcp_servers').dropColumn('headers_json').execute();
  },
};
