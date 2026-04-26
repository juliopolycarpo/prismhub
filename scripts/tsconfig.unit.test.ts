import { describe, expect, test } from 'bun:test';

async function runScriptsTypecheck(): Promise<{
  exitCode: number;
  output: string;
}> {
  const scriptProcess = Bun.spawn(
    ['bun', 'x', 'tsc', '--noEmit', '--project', 'scripts/tsconfig.json', '--pretty', 'false'],
    {
      cwd: import.meta.dir + '/..',
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(scriptProcess.stdout).text(),
    new Response(scriptProcess.stderr).text(),
    scriptProcess.exited,
  ]);

  return {
    exitCode,
    output: `${stdout}\n${stderr}`,
  };
}

describe('root scripts tsconfig', () => {
  test('typechecks Bun scripts without missing global or import-meta errors', async () => {
    const { exitCode, output } = await runScriptsTypecheck();

    expect(exitCode).toBe(0);
    expect(output).not.toContain('Cannot find name');
    expect(output).not.toContain("Property 'dir' does not exist on type 'ImportMeta'");
    expect(output).not.toContain("Property 'main' does not exist on type 'ImportMeta'");
    expect(output).not.toContain("Cannot find module 'bun:test'");
  }, 15000);
});
