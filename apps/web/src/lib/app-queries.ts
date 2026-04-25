import type {
  CacheEntry,
  FeedEnvelope,
  McpServerRecord,
  McpServerToolsResponse,
  RegisterMcpServerInput,
  SettingsRecord,
  UpdateMcpServerInput,
  UpdateSettingsInput,
} from '@prismhub/contracts';
import { queryOptions } from '@tanstack/react-query';
import { api } from './api.ts';
import { requireApiData } from './api-result.ts';
import { queryKeys } from './query-keys.ts';

const SHORT_STALE_MS = 30_000;
const MEDIUM_STALE_MS = 60_000;
const LONG_STALE_MS = 300_000;

export interface LiveSummary {
  readonly sessions: {
    readonly total: number;
    readonly active: number;
    readonly latestId: string | null;
  };
  readonly upstreams: { readonly total: number; readonly enabled: number };
}

export interface CacheStats {
  readonly tokensSavedToday: number;
  readonly economyToday: number;
  readonly economyMonth: number;
  readonly hitRate: number;
  readonly entriesTotal: number;
  readonly entriesFresh: number;
  readonly entriesIdle: number;
}

export interface SessionRow {
  readonly id: string;
  readonly source: string;
  readonly agent: string;
  readonly title: string | null;
  readonly status: string;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly messageCount: number;
  readonly toolCallCount: number;
}

export interface RegistrationStatus {
  readonly firstUser: boolean;
  readonly registrationOpen: boolean;
}

const EMPTY_FEED: readonly FeedEnvelope[] = [];

export const feedEntriesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.feed(),
    queryFn: async () => EMPTY_FEED,
    initialData: EMPTY_FEED,
    staleTime: Number.POSITIVE_INFINITY,
  });

export const summaryQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.summary(),
    queryFn: async () =>
      requireApiData<LiveSummary>(await api.api.app.summary.get(), 'Failed to load summary'),
    staleTime: SHORT_STALE_MS,
  });

export const sessionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.sessions(),
    queryFn: async () =>
      requireApiData<readonly SessionRow[]>(
        await api.api.app.sessions.get(),
        'Failed to load sessions',
      ),
    staleTime: LONG_STALE_MS,
  });

export const settingsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.settings(),
    queryFn: async () =>
      requireApiData<SettingsRecord>(await api.api.app.settings.get(), 'Failed to load settings'),
    staleTime: Number.POSITIVE_INFINITY,
  });

export const cacheStatsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.cacheStats(),
    queryFn: async () =>
      requireApiData<CacheStats>(await api.api.app.cache.stats.get(), 'Failed to load cache stats'),
    staleTime: MEDIUM_STALE_MS,
  });

export const cacheEntriesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.cacheEntries(),
    queryFn: async () =>
      requireApiData<readonly CacheEntry[]>(
        await api.api.app.cache.entries.get(),
        'Failed to load cache entries',
      ),
    staleTime: MEDIUM_STALE_MS,
  });

export const mcpServersQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.mcpServers(),
    queryFn: async () =>
      requireApiData<readonly McpServerRecord[]>(
        await api.api.app['mcp-servers'].get(),
        'Failed to load MCP servers',
      ),
    staleTime: SHORT_STALE_MS,
  });

export const mcpServerToolsQueryOptions = (serverId: string) =>
  queryOptions({
    queryKey: queryKeys.mcpServerTools(serverId),
    queryFn: async () =>
      requireApiData<McpServerToolsResponse>(
        await api.api.app['mcp-servers']({ id: serverId }).tools.get(),
        'Failed to load MCP tools',
      ),
    staleTime: SHORT_STALE_MS,
  });

export const registrationStatusQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.registrationStatus(),
    queryFn: fetchRegistrationStatus,
    staleTime: LONG_STALE_MS,
    retry: false,
  });

export async function updateSettings(patch: UpdateSettingsInput): Promise<SettingsRecord> {
  return requireApiData(await api.api.app.settings.patch(patch), 'Failed to update settings');
}

export async function updateMcpServer(args: {
  readonly id: string;
  readonly patch: UpdateMcpServerInput;
}): Promise<McpServerRecord> {
  const response = await api.api.app['mcp-servers']({ id: args.id }).patch(args.patch);
  return requireApiData(response, 'Failed to update MCP server');
}

export async function registerMcpServer(input: RegisterMcpServerInput): Promise<McpServerRecord> {
  return requireApiData(
    await api.api.app['mcp-servers'].post(input),
    'Failed to register MCP server',
  );
}

const REGISTRATION_STATUS_TIMEOUT_MS = 5_000;

async function fetchRegistrationStatus(): Promise<RegistrationStatus> {
  try {
    const response = await fetch('/api/v1/registration-status', {
      signal: AbortSignal.timeout(REGISTRATION_STATUS_TIMEOUT_MS),
    });
    if (!response.ok) return { firstUser: false, registrationOpen: true };
    return (await response.json()) as RegistrationStatus;
  } catch {
    return { firstUser: false, registrationOpen: true };
  }
}
