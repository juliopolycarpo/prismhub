import type { ToolDefinition } from '@prismhub/mcp-core';

export const ECHO_UPSTREAM_TOOL: ToolDefinition = {
  name: 'echo',
  description: 'Returns the input text from the upstream MCP server.',
  inputSchema: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text'],
    additionalProperties: false,
  },
  handler: async (args) => ({
    content: [{ type: 'text', text: String(args['text'] ?? '') }],
  }),
};
