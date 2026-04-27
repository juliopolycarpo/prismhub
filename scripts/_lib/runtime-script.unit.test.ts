import { describe, expect, mock, test } from 'bun:test';

describe('runRuntimeScript()', () => {
  test('delegates to inheritSpawn with the runtime subcommand and argv', async () => {
    let receivedCommand: readonly string[] | undefined;
    const inheritSpawnMock = mock(async (command: readonly string[]) => {
      receivedCommand = command;
      return 0;
    });
    await mock.module('./spawn', () => ({ inheritSpawn: inheritSpawnMock }));

    const { runRuntimeScript } = await import('./runtime-script');

    const code = await runRuntimeScript('serve', ['--port', '9090']);

    expect(code).toBe(0);
    expect(inheritSpawnMock).toHaveBeenCalledTimes(1);
    expect(receivedCommand?.[0]).toBe(process.execPath);
    expect(receivedCommand).toContain('apps/runtime/src/main.ts');
    expect(receivedCommand).toContain('serve');
    expect(receivedCommand).toContain('--port');
    expect(receivedCommand).toContain('9090');
  });

  test('forwards the migrate subcommand and a non-zero exit code', async () => {
    let receivedCommand: readonly string[] | undefined;
    const inheritSpawnMock = mock(async (command: readonly string[]) => {
      receivedCommand = command;
      return 7;
    });
    await mock.module('./spawn', () => ({ inheritSpawn: inheritSpawnMock }));

    const { runRuntimeScript } = await import('./runtime-script');

    const code = await runRuntimeScript('migrate', []);

    expect(code).toBe(7);
    expect(receivedCommand).toContain('migrate');
  });
});
