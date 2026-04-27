import type { McpServerRecord } from '@prismhub/contracts';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { Card, Toggle } from '../ui';
import { McpServerSettingsModal } from './mcp-server-settings-modal.tsx';
import { McpToolsList } from './mcp-tools-list.tsx';

interface McpServerCardProps {
  readonly mcp: McpServerRecord;
  readonly color: string;
  readonly onToggle: (enabled: boolean) => void;
}

export function McpServerCard({ mcp, color, onToggle }: McpServerCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Card className="p-5 flex flex-col h-full bg-stone-900/50 hover:border-stone-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center font-bold text-lg"
            style={{ color }}
          >
            {mcp.name[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h3 className="text-stone-200 font-medium">{mcp.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: mcp.enabled ? '#f97316' : '#57534e' }}
              />
              <span className="text-xs text-stone-500">
                {mcp.enabled ? 'ativo' : 'desativado'} · {mcp.transport}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Configurar ${mcp.name}`}
            onClick={() => setSettingsOpen(true)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          >
            <Settings size={14} />
          </button>
          <Toggle isActive={mcp.enabled} onChange={() => onToggle(!mcp.enabled)} />
        </div>
      </div>

      <p className="text-sm text-stone-400 mb-4">
        {mcp.description ?? (mcp.transport === 'stdio' ? mcp.command : mcp.url) ?? 'sem descrição'}
      </p>

      <div className="border-t-[0.5px] border-stone-800 pt-3 mt-auto">
        <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-2">Tools</p>
        {mcp.enabled ? (
          <McpToolsList serverId={mcp.id} />
        ) : (
          <p className="text-xs text-stone-500">Ative o servidor para listar tools.</p>
        )}
      </div>

      {settingsOpen && <McpServerSettingsModal mcp={mcp} onClose={() => setSettingsOpen(false)} />}
    </Card>
  );
}
