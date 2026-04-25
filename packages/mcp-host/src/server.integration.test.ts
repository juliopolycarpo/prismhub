import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { ToolDefinition } from '@prismhub/mcp-core';
import { createToolRegistry } from '@prismhub/mcp-core';
import { createPrismMcpServer } from './server.ts';

const echoTool: ToolDefinition = {
  name: 'echo',
  description: 'Returns the input text',
  inputSchema: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text'],
  },
  handler: async (args) => ({ content: [{ type: 'text', text: String(args['text'] ?? '') }] }),
};

const failTool: ToolDefinition = {
  name: 'fail',
  description: 'Always throws',
  inputSchema: { type: 'object' },
  handler: async () => {
    throw new Error('intentional failure');
  },
};

async function buildTestPair(tools: readonly ToolDefinition[]) {
  const registry = createToolRegistry(tools);
  const server = createPrismMcpServer({ name: 'test', version: '0.0.0', registry });
  const client = new Client({ name: 'test-client', version: '0.0.0' }, { capabilities: {} });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, server };
}

describe('createPrismMcpServer()', () => {
  let client: Client;

  beforeEach(async () => {
    ({ client } = await buildTestPair([echoTool, failTool]));
  });

  afterEach(async () => {
    await client.close();
  });

  test('lists all registered tools', async () => {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name);
    expect(names).toContain('echo');
    expect(names).toContain('fail');
    expect(result.tools).toHaveLength(2);
  });

  test('lists zero tools when registry is empty', async () => {
    const { client: emptyClient } = await buildTestPair([]);
    const result = await emptyClient.listTools();
    expect(result.tools).toHaveLength(0);
    await emptyClient.close();
  });

  test('calls a tool and returns content', async () => {
    const result = await client.callTool({ name: 'echo', arguments: { text: 'hello' } });
    expect(result.content).toEqual([{ type: 'text', text: 'hello' }]);
    expect(result.isError).toBeFalsy();
  });

  test('returns isError: true for unknown tool', async () => {
    const result = await client.callTool({ name: 'no-such-tool', arguments: {} });
    expect(result.isError).toBe(true);
    const [first] = result.content as Array<{ type: string; text: string }>;
    expect(first?.text).toContain('Unknown tool');
  });

  test('returns isError: true when tool handler throws', async () => {
    const result = await client.callTool({ name: 'fail', arguments: {} });
    expect(result.isError).toBe(true);
    const [first] = result.content as Array<{ type: string; text: string }>;
    expect(first?.text).toBe('intentional failure');
  });
});
