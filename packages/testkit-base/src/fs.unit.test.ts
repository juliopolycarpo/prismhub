import { describe, expect, test } from 'bun:test';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createTempDirectory, withTempDirectory } from './fs.ts';

describe('createTempDirectory()', () => {
  test('creates a directory that exists on disk', () => {
    const handle = createTempDirectory();

    try {
      expect(existsSync(handle.path)).toBe(true);
      expect(statSync(handle.path).isDirectory()).toBe(true);
    } finally {
      handle.cleanup();
    }
  });

  test('cleanup() removes the directory and its contents recursively', async () => {
    const handle = createTempDirectory();
    const nested = join(handle.path, 'nested.txt');
    await Bun.write(nested, 'x');

    handle.cleanup();

    expect(existsSync(handle.path)).toBe(false);
  });

  test('cleanup() is idempotent', () => {
    const handle = createTempDirectory();

    handle.cleanup();
    expect(() => {
      handle.cleanup();
    }).not.toThrow();
  });

  test('honors the prefix argument', () => {
    const handle = createTempDirectory('custom-prefix-');

    try {
      expect(handle.path).toContain('custom-prefix-');
    } finally {
      handle.cleanup();
    }
  });
});

describe('withTempDirectory()', () => {
  test('cleans the directory after the callback resolves', async () => {
    let captured = '';

    await withTempDirectory((path) => {
      captured = path;
      expect(existsSync(path)).toBe(true);
    });

    expect(captured).not.toBe('');
    expect(existsSync(captured)).toBe(false);
  });

  test('cleans the directory even if the callback throws', async () => {
    let captured = '';

    let threw: unknown;
    try {
      await withTempDirectory((path) => {
        captured = path;
        throw new Error('boom');
      });
    } catch (err) {
      threw = err;
    }

    expect(threw).toBeInstanceOf(Error);
    expect((threw as Error).message).toBe('boom');
    expect(existsSync(captured)).toBe(false);
  });
});
