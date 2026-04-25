import {
  Bolt,
  Clock,
  Database,
  LayoutDashboard,
  LogOut,
  Plus,
  Server,
  Share2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { AuthenticatedPath } from '../lib/dashboard-paths.ts';
import { mcpServersQueryOptions } from '../lib/app-queries.ts';
import { useAuth } from '../lib/use-auth.ts';
import { cn } from '../lib/cn.ts';
import { mcpColorAt } from '../lib/colors.ts';

interface NavItem {
  readonly path: AuthenticatedPath;
  readonly icon: LucideIcon;
  readonly label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: '/live', icon: LayoutDashboard, label: 'Ao vivo' },
  { path: '/history', icon: Clock, label: 'Histórico' },
  { path: '/mcps', icon: Share2, label: 'MCPs' },
  { path: '/local-mcp', icon: Server, label: 'Servidor Local' },
  { path: '/cache', icon: Database, label: 'Cache' },
  { path: '/settings', icon: Bolt, label: 'Configurações' },
];

export interface SidebarMcp {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

const EMPTY_SIDEBAR_MCPS: readonly SidebarMcp[] = [];

function useSidebarMcps(): readonly SidebarMcp[] {
  const { data } = useQuery({
    ...mcpServersQueryOptions(),
    select: (servers) => servers.map((mcp, index) => toSidebarMcp(mcp.id, mcp.name, index)),
  });
  return data ?? EMPTY_SIDEBAR_MCPS;
}

function toSidebarMcp(id: string, name: string, index: number): SidebarMcp {
  return { id, name, color: mcpColorAt(index) };
}

function SidebarHeader() {
  return (
    <div className="p-6 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center border-[0.5px] border-orange-500/30">
        <Sparkles size={16} />
      </div>
      <div>
        <h1 className="font-semibold text-stone-100 text-sm">Prism Hub</h1>
        <p className="text-xs text-stone-500">seu hub de IA</p>
      </div>
    </div>
  );
}

function SidebarNav({ mcpCount }: { readonly mcpCount: number }) {
  return (
    <div>
      <h2 className="px-3 text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">
        Navegação
      </h2>
      <nav className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const props = item.path === '/mcps' && mcpCount > 0 ? { count: mcpCount } : {};
          return <SidebarNavItem key={item.path} item={item} {...props} />;
        })}
      </nav>
    </div>
  );
}

function SidebarNavItem({ item, count }: { readonly item: NavItem; readonly count?: number }) {
  const Icon = item.icon;
  const matchRoute = useMatchRoute();
  const isActive = Boolean(matchRoute({ to: item.path }));
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
        isActive
          ? 'bg-stone-800/80 text-orange-100 font-medium'
          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40',
      )}
    >
      <Icon size={16} className={isActive ? 'text-orange-500' : 'text-stone-500'} />
      <span className="flex-1">{item.label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded-full font-medium">
          {count}
        </span>
      )}
    </Link>
  );
}

function SidebarConnectedMcps({ mcps }: { readonly mcps: readonly SidebarMcp[] }) {
  return (
    <div>
      <h2 className="px-3 text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">
        MCPs Conectados
      </h2>
      <div className="space-y-0.5">
        {mcps.map((mcp) => (
          <div key={mcp.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mcp.color }} />
              <span className="text-stone-300">{mcp.name}</span>
            </div>
          </div>
        ))}
        <Link
          to="/mcps"
          className="flex items-center gap-2 px-3 py-2 mt-2 text-sm text-stone-400 hover:text-stone-200 w-full rounded-md hover:bg-stone-800/40 border-[0.5px] border-dashed border-stone-800"
        >
          <Plus size={14} />
          <span>Adicionar Servidor MCP</span>
        </Link>
      </div>
    </div>
  );
}

function SidebarProfile() {
  const { user, signOut } = useAuth();
  const initials = (user?.name ?? user?.email ?? '??').slice(0, 2).toUpperCase();
  const displayName = user?.name ?? user?.email ?? 'desconhecido';
  return (
    <div className="p-4 border-t-[0.5px] border-stone-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-medium text-stone-300">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-200 truncate">{displayName}</p>
          <p className="text-[10px] text-stone-500 capitalize">{user?.role ?? 'user'} · local</p>
        </div>
        <button
          type="button"
          aria-label="Sair"
          onClick={() => {
            void signOut();
          }}
          className="text-stone-500 hover:text-stone-200"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

export function MainLayout() {
  const mcps = useSidebarMcps();
  return (
    <div className="flex h-screen w-full bg-stone-900 text-stone-200 overflow-hidden font-sans">
      <aside className="w-64 flex flex-col border-r-[0.5px] border-stone-800 bg-stone-950">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-8 no-scrollbar">
          <SidebarNav mcpCount={mcps.length} />
          <SidebarConnectedMcps mcps={mcps} />
        </div>
        <SidebarProfile />
      </aside>
      <main className="flex-1 overflow-hidden flex flex-col bg-stone-900 border-l-[0.5px] border-stone-800 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.02)]">
        <Outlet />
      </main>
    </div>
  );
}
