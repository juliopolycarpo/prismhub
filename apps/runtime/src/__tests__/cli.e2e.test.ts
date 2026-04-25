import { describe, expect, test } from 'bun:test';

const RUNTIME_BIN = `${import.meta.dir}/../main.ts`;

async function runCli(
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(['bun', 'run', RUNTIME_BIN, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, stdout, stderr };
}

describe('CLI smoke tests', () => {
  test('version exits 0 and prints version', async () => {
    const { exitCode, stdout } = await runCli(['version']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('--version alias works', async () => {
    const { exitCode, stdout } = await runCli(['--version']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('help exits 0 and prints usage', async () => {
    const { exitCode, stdout } = await runCli(['help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('prismhub <command>');
  });

  test('unknown command exits 2', async () => {
    const { exitCode, stderr } = await runCli(['nonexistent-command-xyz']);
    expect(exitCode).toBe(2);
    expect(stderr).toContain('Unknown command');
  });
});
