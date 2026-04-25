import { describe, expect, test } from 'bun:test';
import type { RuntimeConfig } from './config.types.ts';
import { loadConfig } from './loader.ts';

function fakeEnv(values: Record<string, string | undefined>): {
  get: (n: string) => string | undefined;
} {
  return { get: (name) => values[name] };
}

describe('loadConfig', () => {
  test('returns defaults when no env vars are set', () => {
    const config = loadConfig(fakeEnv({}));
    expect(config.http.host).toBe('127.0.0.1');
    expect(config.http.port).toBe(3030);
    expect(config.env).toBe('development');
    expect(config.logging.level).toBe('info');
    expect(config.paths.databasePath).toMatch(/\.prismhub\/database\/database\.sqlite$/);
  });

  test('parses PRISMHUB_PORT', () => {
    const config = loadConfig(fakeEnv({ PRISMHUB_PORT: '4000' }));
    expect(config.http.port).toBe(4000);
  });

  test('rejects invalid PRISMHUB_PORT', () => {
    expect(() => loadConfig(fakeEnv({ PRISMHUB_PORT: 'abc' }))).toThrow(/Invalid PRISMHUB_PORT/);
  });

  test('refuses non-local bind without opt-in', () => {
    expect(() => loadConfig(fakeEnv({ PRISMHUB_HOST: '0.0.0.0' }))).toThrow(/non-local host/);
  });

  test('allows non-local bind when trust flag is on', () => {
    const config = loadConfig(fakeEnv({ PRISMHUB_HOST: '0.0.0.0', PRISMHUB_TRUST_NON_LOCAL: '1' }));
    expect(config.http.host).toBe('0.0.0.0');
    expect(config.http.trustNonLocal).toBe(true);
  });

  test('honors PRISMHUB_DATA_DIR override', () => {
    const config = loadConfig(fakeEnv({ PRISMHUB_DATA_DIR: '/tmp/prism-test' }));
    expect(config.paths.dataDir).toBe('/tmp/prism-test');
    expect(config.paths.databasePath).toBe('/tmp/prism-test/database/database.sqlite');
  });

  test('stdioSafe is read from PRISMHUB_STDIO', () => {
    const config = loadConfig(fakeEnv({ PRISMHUB_STDIO: '1' }));
    expect(config.logging.stdioSafe).toBe(true);
  });

  test('uses dev fallback secret when BETTER_AUTH_SECRET is unset', () => {
    const config = loadConfig(fakeEnv({}));
    expect(config.auth.secret.length).toBeGreaterThanOrEqual(32);
    expect(config.auth.baseUrl).toBe('http://127.0.0.1:3030');
  });

  test('requires BETTER_AUTH_SECRET in production', () => {
    expect(() => loadConfig(fakeEnv({ NODE_ENV: 'production' }))).toThrow(/BETTER_AUTH_SECRET/);
  });

  test('honors long enough BETTER_AUTH_SECRET in production', () => {
    const secret = 's'.repeat(40);
    const config: RuntimeConfig = loadConfig(
      fakeEnv({ NODE_ENV: 'production', BETTER_AUTH_SECRET: secret }),
    );

    expect(config.auth.secret).toBe(secret);
  });

  test('honors BETTER_AUTH_URL override', () => {
    const config = loadConfig(
      fakeEnv({ BETTER_AUTH_URL: 'https://prism.example', BETTER_AUTH_SECRET: 's'.repeat(40) }),
    );
    expect(config.auth.baseUrl).toBe('https://prism.example');
  });

  test('seeds dev frontend origins into auth.trustedOrigins by default', () => {
    const config = loadConfig(fakeEnv({}));
    expect(config.auth.trustedOrigins).toContain('http://127.0.0.1:3030');
    expect(config.auth.trustedOrigins).toContain('http://localhost:5173');
    expect(config.auth.trustedOrigins).toContain('http://127.0.0.1:5173');
  });

  test.each([
    [
      'honors BETTER_AUTH_TRUSTED_ORIGINS extras',
      'https://a.example,https://b.example',
      ['https://a.example', 'https://b.example'],
    ],
    [
      'seeds defaults when no extras',
      undefined,
      ['http://127.0.0.1:3030', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    ],
  ])('%s', (name, origins, expected) => {
    const config = loadConfig(fakeEnv({ BETTER_AUTH_TRUSTED_ORIGINS: origins }));
    for (const e of expected) {
      expect(config.auth.trustedOrigins).toContain(e);
    }
  });
});
