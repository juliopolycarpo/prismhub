import { describe, expect, test } from 'bun:test';
import { parseToolParameters } from './tool-parameters.ts';

describe('parseToolParameters', () => {
  test('returns empty list when inputSchema is null', () => {
    expect(parseToolParameters(null)).toEqual([]);
  });

  test('returns empty list when inputSchema has no properties', () => {
    expect(parseToolParameters({ type: 'object' })).toEqual([]);
  });

  test('classifies primitive parameter types and required flag', () => {
    const result = parseToolParameters({
      type: 'object',
      properties: {
        strip_thinking: { type: 'boolean', description: 'Hide CoT' },
        max_tokens: { type: 'integer', minimum: 1, maximum: 4096 },
        temperature: { type: 'number', default: 0.7 },
        query: { type: 'string' },
      },
      required: ['query'],
    });
    const byName = Object.fromEntries(result.map((p) => [p.name, p]));
    expect(byName.strip_thinking?.control).toBe('boolean');
    expect(byName.strip_thinking?.description).toBe('Hide CoT');
    expect(byName.max_tokens?.control).toBe('integer');
    expect(byName.max_tokens?.minimum).toBe(1);
    expect(byName.max_tokens?.maximum).toBe(4096);
    expect(byName.temperature?.control).toBe('number');
    expect(byName.temperature?.defaultValue).toBe(0.7);
    expect(byName.query?.control).toBe('string');
    expect(byName.query?.required).toBe(true);
    expect(byName.strip_thinking?.required).toBe(false);
  });

  test('detects string enums as enum control', () => {
    const result = parseToolParameters({
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['fast', 'slow'] },
      },
    });
    expect(result[0]?.control).toBe('enum');
    expect(result[0]?.enumOptions).toEqual(['fast', 'slow']);
  });

  test('falls back to unknown for unsupported types', () => {
    const result = parseToolParameters({
      type: 'object',
      properties: {
        payload: { type: 'object' },
      },
    });
    expect(result[0]?.control).toBe('unknown');
  });
});
