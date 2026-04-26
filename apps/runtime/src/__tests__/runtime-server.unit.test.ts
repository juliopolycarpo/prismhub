import { describe, expect, test } from 'bun:test';
import { cleanupRuntimeServer, shutdownRuntimeServer } from './runtime-server.ts';

describe('runtime server test helpers', () => {
  test('ignore missing runtime handles after startup failure', async () => {
    await shutdownRuntimeServer(undefined);

    expect(() => cleanupRuntimeServer(undefined)).not.toThrow();
  });
});
