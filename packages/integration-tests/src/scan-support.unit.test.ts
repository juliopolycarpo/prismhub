import { describe, expect, test } from 'bun:test';
import { createAsyncOnce, hasNodeSpecifierHint, shouldScanRepoFile } from './scan-support.ts';

describe('shouldScanRepoFile', () => {
  test('skips generated source files', () => {
    expect(shouldScanRepoFile('packages/web-assets/src/manifest.generated.ts')).toBeFalse();
  });

  test('skips ignored build directories', () => {
    expect(shouldScanRepoFile('packages/auth/dist/auth.js')).toBeFalse();
  });

  test('keeps normal source files', () => {
    expect(shouldScanRepoFile('packages/auth/src/auth.integration.test.ts')).toBeTrue();
  });
});

describe('hasNodeSpecifierHint', () => {
  test('matches node-prefixed imports only', () => {
    expect(hasNodeSpecifierHint("import { join } from 'node:path';")).toBeTrue();
    expect(hasNodeSpecifierHint("import { readFile } from 'fs/promises';")).toBeFalse();
  });
});

describe('createAsyncOnce', () => {
  test('reuses the first in-flight promise', async () => {
    let calls = 0;
    const load = createAsyncOnce(async () => {
      calls += 1;
      await Bun.sleep(1);
      return calls;
    });

    const [first, second, third] = await Promise.all([load(), load(), load()]);

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(third).toBe(1);
    expect(calls).toBe(1);
  });
});
