import { describe, expect, test } from 'bun:test';
import {
  ConfigError,
  parseAuthBaseUrl,
  parseAuthSecret,
  parseBoolean,
  parseEnvironment,
  parseHost,
  parseLogLevel,
  parsePort,
  parseTrustedOrigins,
} from './env.ts';

describe('parseHost()', () => {
  test.each([
    ['returns default when undefined', undefined, '127.0.0.1'],
    ['returns default when empty', '', '127.0.0.1'],
    ['returns raw value when provided', '0.0.0.0', '0.0.0.0'],
  ])('%s', (_, input, expected) => {
    expect(parseHost(input)).toBe(expected);
  });
});

describe('parsePort()', () => {
  test('returns default when undefined', () => {
    expect(parsePort(undefined)).toBe(3030);
  });

  test('parses a valid port', () => {
    expect(parsePort('8080')).toBe(8080);
  });

  test('throws ConfigError for non-integer', () => {
    expect(() => parsePort('abc')).toThrow(ConfigError);
  });

  test('throws ConfigError for port below 1', () => {
    expect(() => parsePort('0')).toThrow(ConfigError);
  });

  test('throws ConfigError for port above 65535', () => {
    expect(() => parsePort('65536')).toThrow(ConfigError);
  });
});

describe('parseBoolean()', () => {
  test.each([['1'], ['true'], ['yes'], ['on']])('returns true for "%s"', (val) => {
    expect(parseBoolean(val, false)).toBe(true);
  });

  test.each([['0'], ['false'], ['no'], ['off'], ['']])('returns false for "%s"', (val) => {
    expect(parseBoolean(val, true)).toBe(false);
  });

  test('returns fallback when undefined', () => {
    expect(parseBoolean(undefined, true)).toBe(true);
    expect(parseBoolean(undefined, false)).toBe(false);
  });

  test('throws ConfigError for unknown value', () => {
    expect(() => parseBoolean('maybe', false)).toThrow(ConfigError);
  });
});

describe('parseLogLevel()', () => {
  test.each(['debug', 'info', 'warn', 'error'])('returns "%s" unchanged', (level) => {
    expect(parseLogLevel(level)).toBe(level);
  });

  test('returns "info" when undefined', () => {
    expect(parseLogLevel(undefined)).toBe('info');
  });

  test('throws ConfigError for unknown level', () => {
    expect(() => parseLogLevel('verbose')).toThrow(ConfigError);
  });
});

describe('parseEnvironment()', () => {
  test.each([
    ['returns production for production', 'production', 'production'],
    ['returns production for prod', 'prod', 'production'],
    ['returns test for test', 'test', 'test'],
    ['returns development when undefined', undefined, 'development'],
    ['returns development for unknown', 'staging', 'development'],
  ] as const)('%s', (_, input, expected) => {
    expect(parseEnvironment(input)).toBe(expected);
  });
});

describe('parseAuthSecret()', () => {
  const valid = 'a'.repeat(32);

  test('returns the raw value when long enough', () => {
    expect(parseAuthSecret(valid, 'production')).toBe(valid);
  });

  test('throws when the value is shorter than 32 chars', () => {
    expect(() => parseAuthSecret('short', 'production')).toThrow(ConfigError);
  });

  test('throws in production when missing', () => {
    expect(() => parseAuthSecret(undefined, 'production')).toThrow(ConfigError);
    expect(() => parseAuthSecret('', 'production')).toThrow(ConfigError);
  });

  test('returns a deterministic dev fallback in development/test', () => {
    const dev = parseAuthSecret(undefined, 'development');
    const test = parseAuthSecret(undefined, 'test');
    expect(dev.length).toBeGreaterThanOrEqual(32);
    expect(test).toBe(dev);
  });
});

describe('parseAuthBaseUrl()', () => {
  test('returns the raw value when provided', () => {
    expect(parseAuthBaseUrl('https://prism.example', { host: '127.0.0.1', port: 3030 })).toBe(
      'https://prism.example',
    );
  });

  test('falls back to host:port when missing', () => {
    expect(parseAuthBaseUrl(undefined, { host: '127.0.0.1', port: 3030 })).toBe(
      'http://127.0.0.1:3030',
    );
  });
});

describe('parseTrustedOrigins()', () => {
  test('always includes the baseUrl origin', () => {
    const origins = parseTrustedOrigins(undefined, 'production', 'https://prism.example/whatever');
    expect(origins).toContain('https://prism.example');
  });

  test('seeds Vite dev origins in development', () => {
    const origins = parseTrustedOrigins(undefined, 'development', 'http://127.0.0.1:3030');
    expect(origins).toContain('http://localhost:5173');
    expect(origins).toContain('http://127.0.0.1:5173');
    expect(origins).toContain('http://127.0.0.1:3030');
  });

  test('seeds Vite dev origins in test', () => {
    const origins = parseTrustedOrigins(undefined, 'test', 'http://127.0.0.1:3030');
    expect(origins).toContain('http://localhost:5173');
  });

  test('does NOT seed Vite dev origins in production', () => {
    const origins = parseTrustedOrigins(undefined, 'production', 'https://prism.example');
    expect(origins).not.toContain('http://localhost:5173');
    expect(origins).toEqual(['https://prism.example']);
  });

  test('appends comma-separated extras and dedupes', () => {
    const origins = parseTrustedOrigins(
      'https://a.example, https://b.example , https://a.example',
      'production',
      'https://prism.example',
    );
    expect(origins).toEqual(['https://prism.example', 'https://a.example', 'https://b.example']);
  });

  test('ignores empty entries', () => {
    const origins = parseTrustedOrigins(' , ,', 'production', 'https://prism.example');
    expect(origins).toEqual(['https://prism.example']);
  });
});
