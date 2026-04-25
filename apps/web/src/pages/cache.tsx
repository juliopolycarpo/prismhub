import type { CacheEntry } from '@prismhub/contracts';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Badge, Button, Card, StatCard } from '../components/ui.tsx';
import {
  cacheEntriesQueryOptions,
  cacheStatsQueryOptions,
  type CacheStats,
} from '../lib/app-queries.ts';

const EMPTY_CACHE_ENTRIES: readonly CacheEntry[] = [];

export function CachePage() {
  const stats = useQuery(cacheStatsQueryOptions());
  const entries = useQuery(cacheEntriesQueryOptions());

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-900 overflow-hidden">
      <header className="px-8 py-8 shrink-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Cache</h1>
          <p className="text-sm text-stone-400 mt-1">
            O que os agentes já leram — reusado quando ainda é válido.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download size={16} /> Exportar
          </Button>
          <Button variant="outline">Limpar expirados</Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8">
        <StatsGrid stats={stats.data ?? null} isError={stats.isError} />
        <EntriesTable entries={entries.data ?? EMPTY_CACHE_ENTRIES} isError={entries.isError} />
      </div>
    </div>
  );
}

function StatsGrid({
  stats,
  isError,
}: {
  readonly stats: CacheStats | null;
  readonly isError: boolean;
}) {
  if (isError) return <p className="text-sm text-red-400">Falha ao carregar estatísticas.</p>;
  if (!stats) {
    return <p className="text-sm text-stone-500">Carregando estatísticas…</p>;
  }
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        headline={`${(stats.tokensSavedToday / 1000).toFixed(1)}k`}
        label="tokens salvos · hoje"
        hint={stats.tokensSavedToday === 0 ? 'sem dados' : '↑ vs ontem'}
      />
      <StatCard
        headline={`R$ ${stats.economyToday.toFixed(2).replace('.', ',')}`}
        label="economia · hoje"
        hint={`R$ ${stats.economyMonth.toFixed(2).replace('.', ',')} no mês`}
      />
      <StatCard headline={`${stats.hitRate}%`} label="hit rate médio" hint="últimas 24h" />
      <StatCard
        headline={`${(stats.entriesTotal / 1000).toFixed(1)}k`}
        label="entradas em cache"
        hint={`${stats.entriesFresh} frescas · ${stats.entriesIdle} idle`}
      />
    </div>
  );
}

function EntriesTable({
  entries,
  isError,
}: {
  readonly entries: readonly CacheEntry[];
  readonly isError: boolean;
}) {
  if (isError) {
    return (
      <Card className="bg-stone-900/30 overflow-hidden border-stone-800 p-8 text-center">
        <p className="text-sm text-red-400">Falha ao carregar entradas em cache.</p>
      </Card>
    );
  }
  if (entries.length === 0) {
    return (
      <Card className="bg-stone-900/30 overflow-hidden border-stone-800 p-8 text-center">
        <p className="text-sm text-stone-500">Nenhuma entrada em cache ainda.</p>
      </Card>
    );
  }
  return (
    <Card className="bg-stone-900/30 overflow-hidden border-stone-800">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-stone-500 uppercase tracking-wider bg-stone-950/50 border-b-[0.5px] border-stone-800">
            <tr>
              <th className="px-6 py-4 font-medium">Entrada</th>
              <th className="px-6 py-4 font-medium">Tamanho</th>
              <th className="px-6 py-4 font-medium">Hits</th>
              <th className="px-6 py-4 font-medium">Idade</th>
              <th className="px-6 py-4 font-medium">TTL</th>
              <th className="px-6 py-4 font-medium">Tokens salvos</th>
              <th className="px-6 py-4 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-[0.5px] divide-stone-800/50">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EntryRow({ entry }: { readonly entry: CacheEntry }) {
  const variant =
    entry.status === 'fresh' ? 'success' : entry.status === 'stale' ? 'warning' : 'default';
  return (
    <tr className="hover:bg-stone-800/20 transition-colors">
      <td className="px-6 py-4 font-mono text-xs text-stone-300 truncate max-w-md">{entry.path}</td>
      <td className="px-6 py-4 text-stone-400">{(entry.size / 1024).toFixed(1)} KB</td>
      <td className="px-6 py-4 text-stone-400">{entry.hits}</td>
      <td className="px-6 py-4 text-stone-400">{entry.age}</td>
      <td className="px-6 py-4 text-stone-400">{entry.ttl}</td>
      <td className="px-6 py-4 text-green-500/80">{entry.tokensSaved}</td>
      <td className="px-6 py-4 text-right">
        <Badge variant={variant}>{entry.status}</Badge>
      </td>
    </tr>
  );
}
