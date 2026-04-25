import { describe, expect, test } from 'bun:test';
import { loadConfig } from './loader.ts';

describe('.prismhub/.env.example', () => {
  test('all documented variables parse without error via loadConfig', async () => {
    const exampleFile = Bun.file(`${import.meta.dir}/../../../.prismhub/.env.example`);
    const raw = await exampleFile.text();
    const env: Record<string, string> = {};

    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }

    expect(() => loadConfig({ get: (name) => env[name] })).not.toThrow();
  });
});
