import { describe, expect, test } from 'bun:test';
import { createStatusTool } from './status.ts';

const fakeStatusService = {
  snapshot: async () => ({
    version: '1.0.0',
    uptimeSec: 42,
    dbReady: true,
    upstreamsCount: 3,
  }),
};

describe('createStatusTool()', () => {
  test('has the correct name and inputSchema', () => {
    const tool = createStatusTool({ statusService: fakeStatusService });
    expect(tool.name).toBe('status');
    expect(tool.inputSchema.type).toBe('object');
  });

  test('handler returns a JSON-formatted snapshot', async () => {
    const tool = createStatusTool({ statusService: fakeStatusService });
    const result = await tool.handler({});
    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    const text = result.content[0]?.text ?? '';
    const parsed = JSON.parse(text) as { version: string; uptimeSec: number; dbReady: boolean };
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.uptimeSec).toBe(42);
    expect(parsed.dbReady).toBe(true);
  });
});
