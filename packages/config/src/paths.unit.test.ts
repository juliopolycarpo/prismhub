import { describe, expect, test } from 'bun:test';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { buildPathsConfig, expandTilde, resolveDataDir } from './paths.ts';

describe('expandTilde()', () => {
  test('expands a bare tilde to the current home directory', () => {
    expect(expandTilde('~')).toBe(homedir());
  });

  test('expands a home-relative path', () => {
    expect(expandTilde('~/workspace/prismhub')).toBe(join(homedir(), 'workspace/prismhub'));
  });

  test('leaves non-tilde paths unchanged', () => {
    expect(expandTilde('/var/lib/prismhub')).toBe('/var/lib/prismhub');
  });
});

describe('resolveDataDir()', () => {
  test('uses the default hidden directory under home when no override is provided', () => {
    expect(resolveDataDir(undefined)).toBe(join(homedir(), '.prismhub'));
  });

  test('expands and resolves an override path', () => {
    expect(resolveDataDir('~/custom/prismhub')).toBe(resolve(join(homedir(), 'custom/prismhub')));
  });

  test('resolves relative overrides against the current working directory', () => {
    expect(resolveDataDir('./tmp/prismhub')).toBe(resolve('./tmp/prismhub'));
  });
});

describe('buildPathsConfig()', () => {
  test('derives all file-system paths from the resolved data directory', () => {
    const config = buildPathsConfig('~/prismhub-data');
    const dataDir = resolve(join(homedir(), 'prismhub-data'));

    expect(config).toEqual({
      home: homedir(),
      dataDir,
      databasePath: join(dataDir, 'database', 'database.sqlite'),
      pidfilePath: join(dataDir, 'prismhub.pid'),
      logsDir: join(dataDir, 'logs'),
    });
  });
});
