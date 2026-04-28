import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  type RouterHistory,
} from '@tanstack/react-router';
import { authClient } from './lib/auth/auth-client.ts';
import { authenticatedPathOrDefault } from './lib/dashboard-paths.ts';
import { appQueryClient, createAppQueryClient } from './lib/query-client.ts';
import {
  cacheEntriesQueryOptions,
  cacheStatsQueryOptions,
  mcpServersQueryOptions,
  sessionsQueryOptions,
  settingsQueryOptions,
  summaryQueryOptions,
} from './lib/app-queries.ts';
import { CachePage } from './pages/cache.tsx';
import { HistoryPage } from './pages/history.tsx';
import { LocalMcpServerPage } from './pages/local-mcp-server/index.tsx';
import { routerToolsQueryOptions } from './pages/local-mcp-server/data.ts';
import { LivePage } from './pages/live/index.tsx';
import { LoginPage } from './pages/login.tsx';
import { McpsPage } from './pages/mcps.tsx';
import { SettingsPage } from './pages/settings.tsx';
import { SignupPage } from './pages/signup.tsx';
import {
  AuthenticatedRoute,
  NotFoundRoute,
  PendingRoute,
  RootRoute,
} from './router-components.tsx';

export interface AppRouterContext {
  readonly queryClient: QueryClient;
}

interface LoginSearch {
  readonly redirect?: ReturnType<typeof authenticatedPathOrDefault>;
}

const rootRoute = createRootRouteWithContext<AppRouterContext>()({
  component: RootRoute,
  notFoundComponent: NotFoundRoute,
  pendingComponent: PendingRoute,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'login',
  validateSearch: validateLoginSearch,
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'signup',
  component: SignupPage,
});

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: async ({ location }) => {
    if (await hasSession()) return;
    throw redirect({
      to: '/login',
      search: { redirect: authenticatedPathOrDefault(location.pathname) },
    });
  },
  component: AuthenticatedRoute,
});

const indexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/live' });
  },
});

const liveRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'live',
  loader: ({ context }) => context.queryClient.ensureQueryData(summaryQueryOptions()),
  component: LivePage,
});

const historyRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'history',
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionsQueryOptions()),
  component: HistoryPage,
});

const mcpsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'mcps',
  loader: ({ context }) => context.queryClient.ensureQueryData(mcpServersQueryOptions()),
  component: McpsPage,
});

const localMcpRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'local-mcp',
  loader: ({ context }) => context.queryClient.ensureQueryData(routerToolsQueryOptions()),
  component: LocalMcpServerPage,
});

const cacheRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'cache',
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(cacheStatsQueryOptions()),
      context.queryClient.ensureQueryData(cacheEntriesQueryOptions()),
    ]);
  },
  component: CachePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: 'settings',
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQueryOptions()),
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  authenticatedRoute.addChildren([
    indexRoute,
    liveRoute,
    historyRoute,
    mcpsRoute,
    localMcpRoute,
    cacheRoute,
    settingsRoute,
  ]),
]);

export function createAppRouter(
  options: { readonly history?: RouterHistory; readonly queryClient?: QueryClient } = {},
) {
  const queryClient = options.queryClient ?? createAppQueryClient();
  const routerOptions = {
    routeTree,
    context: { queryClient },
    basepath: '/dashboard',
    defaultPreload: 'intent',
  } as const;
  if (!options.history) return createRouter(routerOptions);
  return createRouter({ ...routerOptions, history: options.history });
}

export const router = createRouter({
  routeTree,
  context: { queryClient: appQueryClient },
  basepath: '/dashboard',
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function hasSession(): Promise<boolean> {
  const result = await authClient.getSession();
  return Boolean(result.data?.user);
}

function validateLoginSearch(search: Record<string, unknown>): LoginSearch {
  return { redirect: authenticatedPathOrDefault(search.redirect) };
}
