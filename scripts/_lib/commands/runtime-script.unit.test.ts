import { describe, expect, mock, test } from 'bun:test';

import { runRuntimeScript } from './runtime-script';

describe('runRuntimeScript()', () => {
  test('delegates to inheritSpawn with the runtime subcommand and argv', async () => {
    const inheritSpawnMock = mock(async () => {
      return 0;
    });

    const code = await runRuntimeScript('serve', ['--port', '9090'], inheritSpawnMock);

    expect(code).toBe(0);
    expect(inheritSpawnMock).toHaveBeenCalledTimes(1);
    expect(inheritSpawnMock).toHaveBeenCalledWith([
      process.execPath,
      'apps/runtime/src/main.ts',
      'serve',
      '--port',
      '9090',
    ]);
  });

  test('forwards the migrate subcommand and a non-zero exit code', async () => {
    const inheritSpawnMock = mock(async () => {
      return 7;
    });

    const code = await runRuntimeScript('migrate', [], inheritSpawnMock);

    expect(code).toBe(7);
    expect(inheritSpawnMock).toHaveBeenCalledWith([
      process.execPath,
      'apps/runtime/src/main.ts',
      'migrate',
    ]);
  });
});
