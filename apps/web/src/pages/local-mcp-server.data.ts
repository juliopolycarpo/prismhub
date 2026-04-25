import type { McpServerRecord, McpToolSummary } from '@prismhub/contracts';
import { queryOptions } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { queryKeys } from '../lib/query-keys.ts';

export interface RouterTool {
  readonly server: McpServerRecord;
  readonly tool: McpToolSummary;
}

const LOCAL_MCP_PATH = '/mcp';

export const routerToolsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.localMcpTools(),
    queryFn: loadRouterTools,
    staleTime: 30_000,
  });

export async function loadRouterTools(): Promise<readonly RouterTool[]> {
  const servers = await loadEnabledServers();
  const tools = await Promise.all(servers.map(loadServerTools));
  return tools.flat();
}

async function loadEnabledServers(): Promise<readonly McpServerRecord[]> {
  const res = await api.api.app['mcp-servers'].get();
  if (!res.data) throw new Error('Falha ao carregar servidores MCP.');
  return res.data.filter((server) => server.enabled);
}

async function loadServerTools(server: McpServerRecord): Promise<readonly RouterTool[]> {
  const res = await api.api.app['mcp-servers']({ id: server.id }).tools.get();
  if (!res.data) return [];
  return res.data.tools.map((tool) => ({ server, tool }));
}

export function getLocalMcpEndpoint(): string {
  return `${window.location.origin}${LOCAL_MCP_PATH}`;
}

export function toolId(entry: RouterTool): string {
  return `${entry.server.id}:${entry.tool.name}`;
}

export function toggleTool(
  current: ReadonlySet<string>,
  id: string,
  exposed: boolean,
): ReadonlySet<string> {
  const next = new Set(current);
  if (exposed) next.add(id);
  else next.delete(id);
  return next;
}
