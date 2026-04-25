import type { McpServerRecord } from '@prismhub/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AddMcpServerModal } from '../components/mcps/add-mcp-server-modal.tsx';
import { McpServerCard } from '../components/mcps/mcp-server-card.tsx';
import { Button } from '../components/ui.tsx';
import { mcpServersQueryOptions, updateMcpServer } from '../lib/app-queries.ts';
import { mcpColorAt } from '../lib/colors.ts';
import { getErrorMessage } from '../lib/error.ts';
import { queryKeys } from '../lib/query-keys.ts';

const EMPTY_MCP_SERVERS: readonly McpServerRecord[] = [];

export function McpsPage() {
  const queryClient = useQueryClient();
  const serversQuery = useQuery(mcpServersQueryOptions());
  const toggleServer = useMutation({
    mutationFn: updateMcpServer,
    onSuccess: (server) => {
      queryClient.setQueryData(queryKeys.mcpServers(), replaceServer(server));
      void queryClient.invalidateQueries({ queryKey: queryKeys.mcpServers() });
    },
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const servers = serversQuery.data ?? EMPTY_MCP_SERVERS;

  async function toggleEnabled(id: string, enabled: boolean) {
    try {
      await toggleServer.mutateAsync({ id, patch: { enabled } });
    } catch (err) {
      setError(getErrorMessage(err, 'Falha ao atualizar servidor MCP.'));
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-900 overflow-hidden relative">
      <header className="px-8 py-8 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">MCPs conectados</h1>
          <p className="text-sm text-stone-400 mt-1">
            Servidores que seus agentes podem usar. Defaults seguros, sempre editáveis.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus size={16} /> Adicionar Servidor MCP
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {serversQuery.isLoading ? (
          <p className="text-sm text-stone-500">Carregando servidores MCP…</p>
        ) : serversQuery.isError ? (
          <p className="text-sm text-red-400">
            {getErrorMessage(serversQuery.error, 'Falha ao carregar servidores MCP.')}
          </p>
        ) : servers.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nenhum servidor MCP registrado. Clique em "Adicionar Servidor MCP" para começar.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((mcp, i) => (
              <McpServerCard
                key={mcp.id}
                mcp={mcp}
                color={mcpColorAt(i)}
                onToggle={(enabled) => void toggleEnabled(mcp.id, enabled)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <AddMcpServerModal
          onClose={() => setModalOpen(false)}
          onRegistered={async () => {
            setModalOpen(false);
            setError(null);
            await queryClient.invalidateQueries({ queryKey: queryKeys.mcpServers() });
          }}
          onError={setError}
        />
      )}
      {error && (
        <p className="absolute bottom-4 right-4 text-xs text-red-400 bg-red-500/10 border-[0.5px] border-red-500/20 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}

function replaceServer(server: McpServerRecord) {
  return (current: readonly McpServerRecord[] | undefined): readonly McpServerRecord[] => {
    if (!current) return [server];
    return current.map((item) => (item.id === server.id ? server : item));
  };
}
