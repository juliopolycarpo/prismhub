import type { McpServerRecord, McpToolSummary } from '@prismhub/contracts';
import { useQuery } from '@tanstack/react-query';
import { mcpServerToolsQueryOptions } from '../../lib/app-queries.ts';
import { getErrorMessage } from '../../lib/error.ts';
import { AppModal } from '../app-modal.tsx';
import { Button } from '../ui.tsx';
import { McpToolConfigurationCard } from './mcp-tool-configuration-card.tsx';

interface McpServerSettingsModalProps {
  readonly mcp: McpServerRecord;
  readonly onClose: () => void;
}

export function McpServerSettingsModal({ mcp, onClose }: McpServerSettingsModalProps) {
  const tools = useQuery(mcpServerToolsQueryOptions(mcp.id));

  return (
    <AppModal
      title={`Configurar ${mcp.name}`}
      description="Parâmetros aceitos por cada tool exposta pelo servidor."
      onClose={onClose}
      size="lg"
      bodyClassName="space-y-4"
      footer={
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <Body
        tools={tools.data?.tools ?? []}
        warning={tools.data?.error ?? null}
        isLoading={tools.isLoading}
        errorMessage={
          tools.isError ? getErrorMessage(tools.error, 'Falha ao carregar tools.') : null
        }
      />
    </AppModal>
  );
}

function Body({
  tools,
  warning,
  isLoading,
  errorMessage,
}: {
  readonly tools: readonly McpToolSummary[];
  readonly warning: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Carregando tools…</p>;
  }
  if (errorMessage) {
    return <p className="text-sm text-red-400">{errorMessage}</p>;
  }
  if (tools.length === 0) {
    return (
      <p className="text-sm text-stone-500">{warning ?? 'Este servidor não expõe nenhuma tool.'}</p>
    );
  }
  return (
    <>
      {warning && (
        <p className="text-xs text-amber-500/80 border-[0.5px] border-amber-500/20 bg-amber-500/10 px-3 py-2 rounded-md">
          {warning}
        </p>
      )}
      <ul className="space-y-3">
        {tools.map((tool) => (
          <McpToolConfigurationCard key={tool.name} tool={tool} />
        ))}
      </ul>
    </>
  );
}
