import type { ToolRegistry } from '@prismhub/mcp-core';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export interface PrismMcpServerOptions {
  readonly name: string;
  readonly version: string;
  readonly registry: ToolRegistry;
}

export function createPrismMcpServer(options: PrismMcpServerOptions): Server {
  const server = new Server(
    { name: options.name, version: options.version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: options.registry.list().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = options.registry.find(request.params.name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }
    const args = request.params.arguments ?? {};
    try {
      const result = await tool.handler(args);
      return {
        content: result.content.map((c) => ({ type: c.type, text: c.text })),
        ...(result.isError ? { isError: true } : {}),
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: error instanceof Error ? error.message : String(error),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
