import type { ToolDefinition, ToolRegistry } from './tool.types.ts';

export class DuplicateToolError extends Error {
  constructor(public readonly toolName: string) {
    super(`Duplicate MCP tool: ${toolName}`);
    this.name = 'DuplicateToolError';
  }
}

export function createToolRegistry(tools: readonly ToolDefinition[]): ToolRegistry {
  const byName = new Map<string, ToolDefinition>();
  for (const tool of tools) {
    if (byName.has(tool.name)) {
      throw new DuplicateToolError(tool.name);
    }
    byName.set(tool.name, tool);
  }

  return {
    list: () => tools,
    find: (name) => byName.get(name),
  };
}

export function textResult(text: string): {
  content: readonly [{ type: 'text'; text: string }];
} {
  return { content: [{ type: 'text' as const, text }] };
}

export function jsonResult(value: unknown): {
  content: readonly [{ type: 'text'; text: string }];
} {
  return textResult(JSON.stringify(value, null, 2));
}
