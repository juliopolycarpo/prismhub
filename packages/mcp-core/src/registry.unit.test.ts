import { describe, expect, test } from 'bun:test';
import { createToolRegistry, textResult } from './registry.ts';
import type { ToolDefinition } from './tool.types.ts';

const sample: ToolDefinition = {
  name: 'echo',
  description: 'echo',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  handler: async () => textResult('ok'),
};

describe('ToolRegistry', () => {
  test('looks up tools by name', () => {
    const reg = createToolRegistry([sample]);
    expect(reg.list()).toHaveLength(1);
    expect(reg.find('echo')?.name).toBe('echo');
    expect(reg.find('missing')).toBeUndefined();
  });

  test('rejects duplicate tool names', () => {
    expect(() => createToolRegistry([sample, sample])).toThrow();
  });
});
