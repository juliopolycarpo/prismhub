import type { McpServerToolsResponse } from '@prismhub/contracts';
import { useQuery } from '@tanstack/react-query';
import { mcpServerToolsQueryOptions } from '../../lib/app-queries.ts';
import { getErrorMessage } from '../../lib/error.ts';

interface McpToolsListProps {
  readonly serverId: string;
}

/** Fetches the upstream tools for a server card and renders a compact list. */
export function McpToolsList({ serverId }: McpToolsListProps) {
  const tools = useQuery(mcpServerToolsQueryOptions(serverId));

  if (tools.isLoading) {
    return <p className="text-xs text-stone-500">Carregando tools…</p>;
  }
  if (tools.isError) {
    return (
      <p className="text-xs text-amber-500/80">
        Tools indisponíveis: {getErrorMessage(tools.error, 'falha ao carregar')}
      </p>
    );
  }
  if (!hasTools(tools.data)) {
    return <p className="text-xs text-stone-500">Nenhuma tool exposta.</p>;
  }
  return (
    <ul className="space-y-1.5" aria-label="Tools disponíveis">
      {tools.data.tools.map((tool) => (
        <li key={tool.name} className="text-xs">
          <span className="font-mono text-stone-200">{tool.name}</span>
          {tool.description && (
            <span className="text-stone-500"> — {tool.description.slice(0, 80)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function hasTools(data: McpServerToolsResponse | undefined): data is McpServerToolsResponse {
  return Boolean(data && data.tools.length > 0);
}
