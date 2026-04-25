import type { FeedEnvelope } from '@prismhub/contracts';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, Download, Pause } from 'lucide-react';
import { Badge, Button, Card, StatCard } from '../components/ui.tsx';
import { summaryQueryOptions, type LiveSummary } from '../lib/app-queries.ts';
import { useFeed, type FeedStatus } from '../lib/feed.ts';
import { cn } from '../lib/cn.ts';
import { LiveFeedVirtualList } from './live-feed-virtual-list.tsx';

export function LivePage() {
  const feed = useFeed();
  const summary = useQuery(summaryQueryOptions());

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <LiveHeader status={feed.status} />
        <LiveFeedVirtualList entries={feed.entries} />
        <LiveInput />
      </div>
      <RightStats feed={feed.entries} summary={summary.data ?? null} />
    </div>
  );
}

function LiveHeader({ status }: { readonly status: FeedStatus }) {
  const variant = status === 'open' ? 'success' : 'default';
  const dotClass = cn(
    'w-1.5 h-1.5 rounded-full',
    status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-stone-500',
  );
  const label = status === 'open' ? 'ao vivo' : status === 'connecting' ? 'conectando' : 'offline';
  return (
    <header className="h-16 border-b-[0.5px] border-stone-800 flex items-center justify-between px-6 shrink-0 bg-stone-900 z-10">
      <div>
        <h2 className="text-stone-100 font-semibold">Sessão ao vivo</h2>
        <p className="text-xs text-stone-500 mt-0.5">Eventos emitidos por agentes conectados</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={variant} className="gap-1.5 px-3">
          <span className={dotClass} />
          {label}
        </Badge>
        <Button variant="outline" size="sm" className="gap-2">
          <Activity size={14} /> Detalhe
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={14} /> Exportar
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Pause size={14} /> Pausar
        </Button>
      </div>
    </header>
  );
}

function LiveInput() {
  return (
    <div className="p-4 border-t-[0.5px] border-stone-800 shrink-0">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Pergunte sobre essa sessão — ex: quais arquivos foram lidos?"
          className="w-full bg-stone-950 border-[0.5px] border-stone-800 rounded-full pl-5 pr-12 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-orange-500/50"
        />
        <button
          type="button"
          className="absolute right-2 w-8 h-8 bg-stone-800 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center text-stone-400 transition-colors"
        >
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function countToolCalls(feed: readonly FeedEnvelope[]): number {
  return feed.filter((e) => e.event.kind === 'session_event' && e.event.event.kind === 'tool_call')
    .length;
}

function RightStats({
  feed,
  summary,
}: {
  readonly feed: readonly FeedEnvelope[];
  readonly summary: LiveSummary | null;
}) {
  const toolCalls = countToolCalls(feed);
  return (
    <div className="w-80 border-l-[0.5px] border-stone-800 bg-stone-950/30 shrink-0 overflow-y-auto">
      <div className="flex border-b-[0.5px] border-stone-800 text-sm">
        <button className="flex-1 py-3 text-center border-b-2 border-orange-500 text-orange-500 font-medium">
          Sessão
        </button>
        <button className="flex-1 py-3 text-center text-stone-500 hover:text-stone-300">
          MCPs
        </button>
        <button className="flex-1 py-3 text-center text-stone-500 hover:text-stone-300">
          Cache
        </button>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard headline={String(feed.length)} label="eventos no feed" />
          <StatCard headline={String(toolCalls)} label="chamadas de tool" />
          <StatCard headline={String(summary?.sessions.active ?? 0)} label="sessões ativas" />
          <StatCard headline={String(summary?.upstreams.enabled ?? 0)} label="MCPs ativos" />
        </div>
        <Card className="p-4 border-orange-500/20 bg-orange-500/5">
          <p className="text-xs text-stone-400 mb-1">economizado hoje com cache</p>
          <p className="text-3xl font-semibold text-orange-500 mb-2">R$ 0,00</p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">Cache local ainda sem dados</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
