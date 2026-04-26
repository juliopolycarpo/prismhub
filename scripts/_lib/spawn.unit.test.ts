import { describe, expect, test } from 'bun:test';
import { bunxCommand, inheritSpawn, turboRunCommand, withoutFlags } from './spawn';

describe('bunxCommand()', () => {
  test('builds a bunx command with passthrough args', () => {
    expect(bunxCommand('prettier', ['.', '--check'])).toEqual([
      process.execPath,
      'x',
      'prettier',
      '.',
      '--check',
    ]);
  });
});

describe('turboRunCommand()', () => {
  test('builds a turbo run command with prefixed and passthrough args', () => {
    expect(turboRunCommand('dev', ['--filter=@prismhub/runtime'], ['--parallel'])).toEqual([
      process.execPath,
      'x',
      'turbo',
      'run',
      'dev',
      '--parallel',
      '--filter=@prismhub/runtime',
    ]);
  });
});

describe('withoutFlags()', () => {
  test('removes only exact flag matches', () => {
    const result = withoutFlags(['--fix', '--filter=fix', 'src'], new Set(['--fix']));

    expect(result).toEqual(['--filter=fix', 'src']);
  });
});

describe('inheritSpawn() signal forwarding', () => {
  test('forwards SIGTERM emitted on parent to the child process', async () => {
    // Spawn a long sleep, then synthesise a SIGTERM on the parent.
    // The registered forwarder must kill the child so it exits non-zero
    // instead of running for 30 seconds.
    const exitedPromise = inheritSpawn(['sleep', '30']);
    // Allow Bun.spawn + listener registration to settle.
    await new Promise((resolve) => setTimeout(resolve, 50));
    process.emit('SIGTERM');
    const code = await exitedPromise;
    expect(code).not.toBe(0);
  });

  test('removes its signal listeners after the child exits', async () => {
    const before = process.listenerCount('SIGTERM');
    await inheritSpawn(['true']);
    const after = process.listenerCount('SIGTERM');
    expect(after).toBe(before);
  });
});
