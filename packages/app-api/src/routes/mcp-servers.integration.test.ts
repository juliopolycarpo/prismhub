import { describe, expect, test } from 'bun:test';
import { useAuthedAppApiClient } from './test-helpers.ts';

const getClient = useAuthedAppApiClient();

describe('private MCP server routes', () => {
  test('registers and updates a server', async () => {
    const client = getClient();
    const createRes = await client.request('/api/app/mcp-servers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Local Echo',
        description: 'Initial description',
        transport: 'stdio',
        command: 'echo',
        args: ['hello'],
      }),
    });
    expect(createRes.status).toBe(200);

    const created = (await createRes.json()) as {
      id: string;
      name: string;
      description: string | null;
      transport: string;
      command: string | null;
      args: string[] | null;
      url: string | null;
      enabled: boolean;
    };
    expect(created).toMatchObject({
      name: 'Local Echo',
      description: 'Initial description',
      transport: 'stdio',
      command: 'echo',
      args: ['hello'],
      url: null,
      enabled: true,
    });
    expect(created.id).toHaveLength(26);

    const patchRes = await client.request(`/api/app/mcp-servers/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false, description: 'Disabled for maintenance' }),
    });
    expect(patchRes.status).toBe(200);

    const updated = (await patchRes.json()) as {
      id: string;
      name: string;
      description: string | null;
      transport: string;
      command: string | null;
      args: string[] | null;
      url: string | null;
      enabled: boolean;
    };
    expect(updated).toMatchObject({
      id: created.id,
      description: 'Disabled for maintenance',
      enabled: false,
    });

    const listRes = await client.request('/api/app/mcp-servers');
    expect(listRes.status).toBe(200);

    const body = (await listRes.json()) as Array<{
      id: string;
      name: string;
      description: string | null;
      transport: string;
      command: string | null;
      args: string[] | null;
      url: string | null;
      enabled: boolean;
    }>;
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id: created.id,
      description: 'Disabled for maintenance',
      enabled: false,
      command: 'echo',
      args: ['hello'],
    });
  });
});

describe('public MCP server routes', () => {
  test('redacts private connection fields from public endpoint', async () => {
    const client = getClient();
    const createRes = await client.request('/api/app/mcp-servers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Remote MCP',
        description: 'Hosted upstream',
        transport: 'http',
        url: 'https://example.com/mcp',
      }),
    });
    expect(createRes.status).toBe(200);

    const listRes = await client.request('/api/v1/mcp-servers');
    expect(listRes.status).toBe(200);

    const body = (await listRes.json()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      name: 'Remote MCP',
      description: 'Hosted upstream',
      transport: 'http',
      enabled: true,
    });
    expect(body[0]).not.toHaveProperty('command');
    expect(body[0]).not.toHaveProperty('args');
    expect(body[0]).not.toHaveProperty('url');
  });
});
