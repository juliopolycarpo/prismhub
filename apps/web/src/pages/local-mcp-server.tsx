import { useQuery } from '@tanstack/react-query';
import { Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SettingsRow, SettingsSection } from '../components/settings-panels.tsx';
import { Badge } from '../components/ui.tsx';
import { cn } from '../lib/cn.ts';
import {
  getLocalMcpEndpoint,
  routerToolsQueryOptions,
  toggleTool,
  toolId,
  type RouterTool,
} from './local-mcp-server.data.ts';
import { RouterToolCard } from './local-mcp-tool-card.tsx';

const CLIENT_LABELS = ['Claude Code', 'Codex', 'Cliente MCP genérico'] as const;
const EMPTY_ROUTER_TOOLS: readonly RouterTool[] = [];

export function LocalMcpServerPage() {
  const tools = useQuery(routerToolsQueryOptions());
  const [exposedToolIds, setExposedToolIds] = useState<ReadonlySet<string>>(new Set());
  const endpoint = useMemo(getLocalMcpEndpoint, []);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-stone-900">
      <LocalMcpHeader exposedCount={exposedToolIds.size} endpoint={endpoint} />
      <div className="flex-1 overflow-y-auto px-8 pb-12">
        <div className="max-w-5xl space-y-6">
          <RouterSetup endpoint={endpoint} />
          <RouterTools
            tools={tools.data ?? EMPTY_ROUTER_TOOLS}
            isLoading={tools.isLoading}
            errorMessage={tools.error instanceof Error ? tools.error.message : null}
            exposedToolIds={exposedToolIds}
            onToggle={setExposedToolIds}
          />
        </div>
      </div>
    </div>
  );
}

function LocalMcpHeader({
  endpoint,
  exposedCount,
}: {
  readonly endpoint: string;
  readonly exposedCount: number;
}) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 px-8 py-8">
      <div>
        <div className="flex items-center gap-3">
          <Server size={22} className="text-orange-500" />
          <h1 className="text-2xl font-bold text-stone-100">Servidor MCP Local</h1>
        </div>
        <p className="mt-1 text-sm text-stone-400">
          Exponha tools escolhidas para clientes locais usando o Prism Hub como roteador MCP.
        </p>
      </div>
      <EndpointPill endpoint={endpoint} exposedCount={exposedCount} />
    </header>
  );
}

function EndpointPill({
  endpoint,
  exposedCount,
}: {
  readonly endpoint: string;
  readonly exposedCount: number;
}) {
  return (
    <div className="rounded-lg border-[0.5px] border-stone-800 bg-stone-950 px-4 py-3 text-right">
      <p className="font-mono text-xs text-stone-300">{endpoint}</p>
      <p className="mt-1 text-[11px] text-stone-500">{exposedCount} tools expostas</p>
    </div>
  );
}

function RouterSetup({ endpoint }: { readonly endpoint: string }) {
  return (
    <SettingsSection
      title="Clientes"
      description="Use o mesmo endpoint local nos clientes que devem consumir o roteador."
    >
      {CLIENT_LABELS.map((client) => (
        <SettingsRow key={client} title={client} rightText={endpoint} />
      ))}
    </SettingsSection>
  );
}

function RouterTools({
  tools,
  isLoading,
  errorMessage,
  exposedToolIds,
  onToggle,
}: {
  readonly tools: readonly RouterTool[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly exposedToolIds: ReadonlySet<string>;
  readonly onToggle: (next: ReadonlySet<string>) => void;
}) {
  if (isLoading) return <ToolStateMessage message="Carregando tools…" />;
  if (errorMessage) return <ToolStateMessage message={errorMessage} tone="error" />;
  if (tools.length === 0) return <ToolStateMessage message="Nenhuma tool disponível." />;
  return <ToolList tools={tools} exposedToolIds={exposedToolIds} onToggle={onToggle} />;
}

function ToolStateMessage({
  message,
  tone = 'muted',
}: {
  readonly message: string;
  readonly tone?: 'muted' | 'error';
}) {
  return (
    <p className={cn('text-sm', tone === 'error' ? 'text-red-400' : 'text-stone-500')}>{message}</p>
  );
}

function ToolList({
  tools,
  exposedToolIds,
  onToggle,
}: {
  readonly tools: readonly RouterTool[];
  readonly exposedToolIds: ReadonlySet<string>;
  readonly onToggle: (next: ReadonlySet<string>) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-stone-200">Tools roteáveis</h2>
        <Badge>{tools.length} disponíveis</Badge>
      </div>
      <ul className="space-y-3">
        {tools.map((entry) => (
          <RouterToolCard
            key={toolId(entry)}
            entry={entry}
            exposed={exposedToolIds.has(toolId(entry))}
            onToggle={(exposed) => onToggle(toggleTool(exposedToolIds, toolId(entry), exposed))}
          />
        ))}
      </ul>
    </section>
  );
}
