import { Download, Filter, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button, Card } from '../components/ui.tsx';
import { sessionsQueryOptions, type SessionRow } from '../lib/app-queries.ts';
import { getErrorMessage } from '../lib/error.ts';

const EMPTY_SESSIONS: readonly SessionRow[] = [];

export function HistoryPage() {
  const sessions = useQuery(sessionsQueryOptions());
  const [filter, setFilter] = useState('');

  const rows = sessions.data ?? EMPTY_SESSIONS;
  const filtered = useMemo(() => filterSessions(rows, filter), [rows, filter]);
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-900 overflow-hidden">
      <header className="px-8 py-8 shrink-0">
        <h1 className="text-2xl font-bold text-stone-100">Histórico</h1>
        <p className="text-sm text-stone-400 mt-1">
          Tudo que seus agentes fizeram, pesquisável e replayável.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por título, agente, fonte..."
              className="w-full bg-stone-950 border-[0.5px] border-stone-800 rounded-lg pl-10 pr-4 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={16} /> Filtros
          </Button>
          <Button variant="outline" className="gap-2">
            <Download size={16} /> Exportar
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8">
        {sessions.isLoading ? (
          <p className="text-sm text-stone-500">Carregando…</p>
        ) : sessions.isError ? (
          <p className="text-sm text-red-400">
            {getErrorMessage(sessions.error, 'Falha ao carregar sessões.')}
          </p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma sessão gravada ainda.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label}>
              <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.rows.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }: { readonly session: SessionRow }) {
  return (
    <Card className="flex items-center justify-between p-4 bg-stone-900/50 hover:bg-stone-800/50 cursor-pointer transition-colors border-stone-800 group">
      <div className="flex items-center gap-4">
        <span className="w-2 h-2 rounded-full bg-stone-600 group-hover:bg-orange-500 transition-colors" />
        <div>
          <h3 className="text-stone-200 font-medium">
            {session.title ?? `sessão ${session.id.slice(0, 8)}`}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {session.source} · {session.agent} · {formatStartedAt(session.startedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-stone-400 bg-stone-800 px-2 py-1 rounded-md">
          {session.status}
        </span>
        <span className="text-xs font-medium text-stone-300">{session.toolCallCount} calls</span>
        <span className="text-xs font-medium text-stone-400 w-24 text-right">
          {session.messageCount} msgs
        </span>
      </div>
    </Card>
  );
}

function filterSessions(rows: readonly SessionRow[], filter: string): readonly SessionRow[] {
  if (!filter.trim()) return rows;
  const needle = filter.toLowerCase();
  return rows.filter((row) => {
    const haystack = `${row.title ?? ''} ${row.agent} ${row.source} ${row.status}`.toLowerCase();
    return haystack.includes(needle);
  });
}

interface Group {
  readonly label: string;
  readonly rows: readonly SessionRow[];
}

function groupByDay(rows: readonly SessionRow[]): readonly Group[] {
  const byKey = new Map<string, SessionRow[]>();
  for (const row of rows) {
    const key = dayLabel(row.startedAt);
    const bucket = byKey.get(key) ?? [];
    bucket.push(row);
    byKey.set(key, bucket);
  }
  return [...byKey.entries()].map(([label, group]) => ({ label, rows: group }));
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recente';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return 'Esta semana';
  return date.toLocaleDateString('pt-BR');
}

function formatStartedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}
