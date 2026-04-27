import { McpToolConfigurationCard } from '../../components/mcps/mcp-tool-configuration-card.tsx';
import { Toggle } from '../../components/ui';
import { cn } from '../../lib/cn.ts';
import type { RouterTool } from './data.ts';

export function RouterToolCard({
  entry,
  exposed,
  onToggle,
}: {
  readonly entry: RouterTool;
  readonly exposed: boolean;
  readonly onToggle: (exposed: boolean) => void;
}) {
  return (
    <McpToolConfigurationCard
      tool={entry.tool}
      className={cn(!exposed && 'border-stone-800/70 opacity-70')}
      action={<ExposureToggle entry={entry} exposed={exposed} onToggle={onToggle} />}
    />
  );
}

function ExposureToggle({
  entry,
  exposed,
  onToggle,
}: {
  readonly entry: RouterTool;
  readonly exposed: boolean;
  readonly onToggle: (exposed: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500">{entry.server.name}</span>
      <Toggle
        ariaLabel={`Expor ${entry.server.name}.${entry.tool.name}`}
        isActive={exposed}
        onChange={() => onToggle(!exposed)}
      />
    </div>
  );
}
