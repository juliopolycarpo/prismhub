export const queryKeys = {
  summary: () => ['summary'] as const,
  feed: () => ['feed', 'live'] as const,
  sessions: () => ['sessions'] as const,
  registrationStatus: () => ['registration-status'] as const,
  settings: () => ['settings'] as const,
  cacheStats: () => ['cache', 'stats'] as const,
  cacheEntries: () => ['cache', 'entries'] as const,
  mcpServers: () => ['mcp-servers'] as const,
  mcpServerTools: (serverId: string) => ['mcp-servers', serverId, 'tools'] as const,
  localMcpTools: () => ['local-mcp', 'tools'] as const,
};
