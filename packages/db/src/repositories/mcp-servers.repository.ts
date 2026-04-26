import type { Selectable, Updateable } from 'kysely';
import type { PrismDatabase } from '../client.ts';
import type { McpServersTable } from '../schema.types.ts';
import { parseJsonStringArray, parseJsonStringRecord } from '../json-utils.ts';
import { boolToInt, intToBool } from '../sqlite-bool.ts';

export interface McpServerRow {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly transport: 'stdio' | 'http';
  readonly command: string | null;
  readonly args: readonly string[] | null;
  readonly url: string | null;
  readonly headers: Readonly<Record<string, string>> | null;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function parseTransport(value: string, serverId: string): McpServerRow['transport'] {
  if (value === 'stdio' || value === 'http') return value;
  throw new Error(
    `mcp_servers.transport has unsupported value ${JSON.stringify(value)} for id=${serverId}; expected stdio or http`,
  );
}

function rowToDomain(row: Selectable<McpServersTable>): McpServerRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    transport: parseTransport(row.transport, row.id),
    command: row.command,
    args: parseJsonStringArray(row.args_json),
    url: row.url,
    headers: parseJsonStringRecord(row.headers_json),
    enabled: intToBool(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface InsertMcpServer {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly transport: 'stdio' | 'http';
  readonly command: string | null;
  readonly args: readonly string[] | null;
  readonly url: string | null;
  readonly headers: Readonly<Record<string, string>> | null;
  readonly enabled: boolean;
}

export async function insertMcpServer(
  db: PrismDatabase,
  input: InsertMcpServer,
): Promise<McpServerRow> {
  const now = new Date().toISOString();
  await db
    .insertInto('mcp_servers')
    .values({
      id: input.id,
      name: input.name,
      description: input.description,
      transport: input.transport,
      command: input.command,
      args_json: input.args ? JSON.stringify(input.args) : null,
      url: input.url,
      headers_json: input.headers ? JSON.stringify(input.headers) : null,
      enabled: boolToInt(input.enabled),
      created_at: now,
      updated_at: now,
    })
    .execute();
  return getMcpServerByIdOrThrow(db, input.id);
}

export async function listMcpServers(db: PrismDatabase): Promise<readonly McpServerRow[]> {
  const rows = await db.selectFrom('mcp_servers').selectAll().orderBy('created_at').execute();
  return rows.map(rowToDomain);
}

export async function countMcpServers(db: PrismDatabase): Promise<number> {
  const row = await db
    .selectFrom('mcp_servers')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();
  return Number(row.count);
}

export async function getMcpServerByIdOrThrow(
  db: PrismDatabase,
  id: string,
): Promise<McpServerRow> {
  const row = await db
    .selectFrom('mcp_servers')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  return rowToDomain(row);
}

export interface UpdateMcpServerPatch {
  readonly enabled?: boolean;
  readonly description?: string | null;
}

export async function updateMcpServer(
  db: PrismDatabase,
  id: string,
  patch: UpdateMcpServerPatch,
): Promise<McpServerRow> {
  const update: Updateable<McpServersTable> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.enabled !== undefined) update.enabled = boolToInt(patch.enabled);
  if (patch.description !== undefined) update.description = patch.description;
  await db.updateTable('mcp_servers').set(update).where('id', '=', id).execute();
  return getMcpServerByIdOrThrow(db, id);
}
