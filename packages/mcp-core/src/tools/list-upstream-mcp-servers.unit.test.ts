import { describe, expect, test } from 'bun:test';
import { createListUpstreamServersTool } from './list-upstream-mcp-servers.ts';

const fakeMcpRegistry = {
  list: async () => [
    {
      id: '01H00000000000000000000001',
      name: 'my-server',
      description: null,
      transport: 'stdio' as const,
      command: 'echo',
      args: null,
      url: null,
      headers: null,
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  register: async () => {
    throw new Error('not used');
  },
  update: async () => {
    throw new Error('not used');
  },
  listTools: async () => ({ serverId: '01H00000000000000000000001', tools: [] }),
};

describe('createListUpstreamServersTool()', () => {
  test('has the correct name', () => {
    const tool = createListUpstreamServersTool({ mcpRegistryService: fakeMcpRegistry });
    expect(tool.name).toBe('list_upstream_mcp_servers');
  });

  test('handler returns server list as JSON', async () => {
    const tool = createListUpstreamServersTool({ mcpRegistryService: fakeMcpRegistry });
    const result = await tool.handler({});
    expect(result.isError).toBeFalsy();
    const text = result.content[0]?.text ?? '';
    const parsed = JSON.parse(text) as Array<{ name: string; enabled: boolean }>;
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.name).toBe('my-server');
    expect(parsed[0]?.enabled).toBe(true);
  });

  test('returns empty array when no servers', async () => {
    const emptyRegistry = { ...fakeMcpRegistry, list: async () => [] };
    const tool = createListUpstreamServersTool({ mcpRegistryService: emptyRegistry });
    const result = await tool.handler({});
    const parsed = JSON.parse(result.content[0]?.text ?? '[]') as unknown[];
    expect(parsed).toHaveLength(0);
  });
});
