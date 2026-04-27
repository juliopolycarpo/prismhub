import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createMcpRegistryService } from './mcp-registry-service.ts';
import { createCoreTestServices, type CoreTestServices } from '../testing/test-services.ts';

let services: CoreTestServices;

beforeEach(async () => {
  services = await createCoreTestServices();
});

afterEach(async () => {
  await services.cleanup();
});

describe('McpRegistryService.list()', () => {
  test('returns empty array initially', async () => {
    expect(await services.mcpRegistryService.list()).toHaveLength(0);
  });
});

describe('McpRegistryService.register()', () => {
  test('registers a stdio server and returns it', async () => {
    const record = await services.mcpRegistryService.register({
      name: 'my-server',
      transport: 'stdio',
      command: 'echo',
      args: ['hi'],
    });
    expect(record.name).toBe('my-server');
    expect(record.transport).toBe('stdio');
    expect(record.enabled).toBe(true);
    expect(record.id).toHaveLength(26); // ulid
  });

  test('persists HTTP headers when transport is http', async () => {
    const record = await services.mcpRegistryService.register({
      name: 'remote',
      transport: 'http',
      url: 'https://mcp.example.com/sse',
      headers: { Authorization: 'Bearer token-abc' },
    });
    expect(record.transport).toBe('http');
    expect(record.headers).toEqual({ Authorization: 'Bearer token-abc' });
  });

  test('assigns unique ids to multiple registrations', async () => {
    const a = await services.mcpRegistryService.register({
      name: 'a',
      transport: 'stdio',
      command: 'a',
    });
    const b = await services.mcpRegistryService.register({
      name: 'b',
      transport: 'stdio',
      command: 'b',
    });
    expect(a.id).not.toBe(b.id);
  });
});

describe('McpRegistryService.update()', () => {
  test('disables a registered server', async () => {
    const registered = await services.mcpRegistryService.register({
      name: 'srv',
      transport: 'stdio',
      command: 'echo',
    });
    const updated = await services.mcpRegistryService.update(registered.id, { enabled: false });
    expect(updated.enabled).toBe(false);
  });
});

describe('McpRegistryService.listTools()', () => {
  test('returns the tools surfaced by the discoverTools strategy', async () => {
    const service = createMcpRegistryService({
      db: services.db,
      discoverTools: async () => [
        { name: 'echo', description: 'echoes input', inputSchema: null },
        { name: 'sum', description: null, inputSchema: null },
      ],
    });
    const registered = await service.register({
      name: 'srv',
      transport: 'stdio',
      command: 'echo',
    });
    const result = await service.listTools(registered.id);
    expect(result.serverId).toBe(registered.id);
    expect(result.tools.map((t) => t.name)).toEqual(['echo', 'sum']);
    expect(result.error).toBeUndefined();
  });

  test('returns empty tools and non-fatal error when discovery fails', async () => {
    const service = createMcpRegistryService({
      db: services.db,
      discoverTools: async () => {
        throw new Error('connection refused');
      },
    });
    const registered = await service.register({
      name: 'srv',
      transport: 'stdio',
      command: 'echo',
    });
    const result = await service.listTools(registered.id);
    expect(result.tools).toHaveLength(0);
    expect(result.error).toBe('connection refused');
  });

  test('signals missing strategy when discoverTools is not configured', async () => {
    const registered = await services.mcpRegistryService.register({
      name: 'srv',
      transport: 'stdio',
      command: 'echo',
    });
    const result = await services.mcpRegistryService.listTools(registered.id);
    expect(result.tools).toHaveLength(0);
    expect(result.error).toBe('tool discovery not configured');
  });
});
