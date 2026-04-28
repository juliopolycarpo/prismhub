import type {
  McpServerRecord,
  McpServerToolsResponse,
  McpToolSummary,
  RegisterMcpServerInput,
  UpdateMcpServerInput,
} from '@prismhub/contracts';
import {
  getMcpServerByIdOrThrow,
  insertMcpServer,
  listMcpServers,
  type McpServerRow,
  type PrismDatabase,
  updateMcpServer,
} from '@prismhub/db';
import { getErrorMessage } from '@prismhub/observability';
import { ulid } from '../ids/ulid.ts';

/**
 * Strategy for talking to a registered upstream and listing its tools.
 * Injected so the core package stays free of the @prismhub/mcp-client dependency.
 */
export type DiscoverServerTools = (server: McpServerRecord) => Promise<readonly McpToolSummary[]>;

export interface McpRegistryService {
  readonly list: () => Promise<readonly McpServerRecord[]>;
  readonly register: (input: RegisterMcpServerInput) => Promise<McpServerRecord>;
  readonly update: (id: string, input: UpdateMcpServerInput) => Promise<McpServerRecord>;
  readonly listTools: (id: string) => Promise<McpServerToolsResponse>;
}

export interface McpRegistryServiceDeps {
  readonly db: PrismDatabase;
  readonly discoverTools?: DiscoverServerTools;
}

function rowToRecord(row: McpServerRow): McpServerRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    transport: row.transport,
    command: row.command,
    args: row.args === null ? null : [...row.args],
    url: row.url,
    headers: row.headers === null ? null : { ...row.headers },
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createMcpRegistryService(deps: McpRegistryServiceDeps): McpRegistryService {
  return {
    async list() {
      const rows = await listMcpServers(deps.db);
      return rows.map(rowToRecord);
    },
    async register(input) {
      const row = await insertMcpServer(deps.db, {
        id: ulid(),
        name: input.name,
        description: input.description ?? null,
        transport: input.transport,
        command: input.command ?? null,
        args: input.args ?? null,
        url: input.url ?? null,
        headers: input.headers ?? null,
        enabled: input.enabled ?? true,
      });
      return rowToRecord(row);
    },
    async update(id, input) {
      const patch: {
        enabled?: boolean;
        description?: string | null;
      } = {};
      if (input.enabled !== undefined) patch.enabled = input.enabled;
      if (input.description !== undefined) patch.description = input.description;
      const row = await updateMcpServer(deps.db, id, patch);
      return rowToRecord(row);
    },
    async listTools(id) {
      const record = rowToRecord(await getMcpServerByIdOrThrow(deps.db, id));
      if (!deps.discoverTools) {
        return { serverId: id, tools: [], error: 'tool discovery not configured' };
      }
      try {
        const tools = await deps.discoverTools(record);
        return { serverId: id, tools: [...tools] };
      } catch (err) {
        const message = getErrorMessage(err, 'tool discovery failed');
        return { serverId: id, tools: [], error: message };
      }
    },
  };
}
