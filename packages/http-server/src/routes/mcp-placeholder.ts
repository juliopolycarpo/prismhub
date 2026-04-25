import { Elysia } from 'elysia';

export function createMcpPlaceholderRoutes() {
  return new Elysia().all('/mcp', ({ set }) => {
    set.status = 501;
    return { error: 'mcp_not_implemented', message: 'MCP transport is wired in Phase 5.' };
  });
}
