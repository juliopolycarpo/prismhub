import { describe, expect, test } from 'bun:test';
import { createToolRegistry } from '@prismhub/mcp-core';
import { createPrismMcpServer, createStreamableHttpPlugin } from '@prismhub/mcp-host';
import { Elysia } from 'elysia';
import { createMcpClientPool } from './pool.ts';
import type { UpstreamHttpTarget, UpstreamStdioTarget } from './pool.ts';
import { ECHO_UPSTREAM_TOOL } from './test-fixtures/echo-upstream-tool.ts';

const STDIO_UPSTREAM_ENTRYPOINT = `${import.meta.dir}/test-fixtures/stdio-upstream.ts`;
const TEST_HOST = '127.0.0.1';
const TEST_PORT_BASE = 41_500;
const TEST_PORT_RANGE = 1_000;

function nextPort(): number {
  return TEST_PORT_BASE + Math.floor(Math.random() * TEST_PORT_RANGE);
}

async function startHttpUpstream() {
  const registry = createToolRegistry([ECHO_UPSTREAM_TOOL]);
  const serverFactory = () =>
    createPrismMcpServer({
      name: 'http-upstream',
      version: '0.0.0',
      registry,
    });
  const app = new Elysia().use(createStreamableHttpPlugin({ serverFactory }));
  const port = nextPort();
  const server = app.listen({ hostname: TEST_HOST, port });

  return {
    stop: async () => {
      await server.stop();
    },
    target: {
      id: 'http-upstream',
      name: 'HTTP Upstream',
      transport: 'http',
      url: new URL(`http://${TEST_HOST}:${port}/mcp`),
    },
  };
}

describe('createMcpClientPool() integration', () => {
  test('connects to a streamable HTTP upstream and calls a tool', async () => {
    const upstream = await startHttpUpstream();

    try {
      const pool = createMcpClientPool();
      const connection = await pool.connect(upstream.target as UpstreamHttpTarget);
      const tools = await connection.client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain('echo');

      const response = await connection.client.callTool({
        name: 'echo',
        arguments: { text: 'hello from prismhub' },
      });

      const [firstContent] = response.content as Array<{ type: 'text'; text: string }>;
      expect(response.isError).toBeUndefined();
      expect(firstContent).toMatchObject({
        type: 'text',
        text: 'hello from prismhub',
      });
      await pool.closeAll();
    } finally {
      await upstream.stop();
    }
  }, 15_000);

  test('connects to a stdio upstream and calls a tool', async () => {
    const target: UpstreamStdioTarget = {
      id: 'stdio-upstream',
      name: 'STDIO Upstream',
      transport: 'stdio',
      command: process.execPath,
      args: ['run', STDIO_UPSTREAM_ENTRYPOINT],
    };

    const pool = createMcpClientPool();
    const connection = await pool.connect(target);
    const tools = await connection.client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain('echo');

    const response = await connection.client.callTool({
      name: 'echo',
      arguments: { text: 'hello from prismhub' },
    });

    const [firstContent] = response.content as Array<{ type: 'text'; text: string }>;
    expect(response.isError).toBeUndefined();
    expect(firstContent).toMatchObject({
      type: 'text',
      text: 'hello from prismhub',
    });

    await pool.closeAll();
  }, 15_000);
});
