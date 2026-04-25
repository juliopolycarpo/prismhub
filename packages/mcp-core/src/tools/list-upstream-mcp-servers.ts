import type { McpRegistryService } from '@prismhub/core';
import { jsonResult } from '../registry.ts';
import type { ToolDefinition } from '../tool.types.ts';

export interface ListUpstreamServersToolDeps {
  readonly mcpRegistryService: McpRegistryService;
}

export function createListUpstreamServersTool(deps: ListUpstreamServersToolDeps): ToolDefinition {
  return {
    name: 'list_upstream_mcp_servers',
    description: 'Lists upstream MCP servers Prismhub knows about (name, transport, enabled).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async () => {
      const servers = await deps.mcpRegistryService.list();
      return jsonResult(
        servers.map((s) => ({
          id: s.id,
          name: s.name,
          transport: s.transport,
          enabled: s.enabled,
        })),
      );
    },
  };
}
