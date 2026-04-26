import { describe, expect, test } from 'bun:test';

const PACKAGE_TSCONFIG = `${import.meta.dir}/../tsconfig.json`;
const TYPECHECK_TIMEOUT_MS = 30_000;
const TYPECHECK_BUILD_INFO = `${Bun.env.TMPDIR ?? '/tmp'}/prismhub-web-assets-tsconfig-${Bun.nanoseconds()}.tsbuildinfo`;
const LEGACY_DECLARATION_ARTIFACTS = [
  'generate.d.ts',
  'generate.d.ts.map',
  'generate.integration.test.d.ts',
  'generate.integration.test.d.ts.map',
  'generate.unit.test.d.ts',
  'generate.unit.test.d.ts.map',
] as const;

async function runPackageTypecheck(): Promise<{ exitCode: number; output: string }> {
  const process = Bun.spawn(
    [
      'bun',
      'x',
      'tsc',
      '--project',
      PACKAGE_TSCONFIG,
      '--noEmit',
      '--tsBuildInfoFile',
      TYPECHECK_BUILD_INFO,
      '--pretty',
      'false',
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);

  return {
    exitCode,
    output: `${stdout}\n${stderr}`,
  };
}

describe('packages/web-assets tsconfig', () => {
  test(
    'typechecks src without pulling script tests into rootDir',
    async () => {
      const { exitCode, output } = await runPackageTypecheck();
      expect(exitCode).toBe(0);
      expect(output).not.toContain('TS6059');
    },
    TYPECHECK_TIMEOUT_MS,
  );

  test('does not keep legacy declaration artifacts', async () => {
    for (const artifact of LEGACY_DECLARATION_ARTIFACTS) {
      const exists = await Bun.file(`${import.meta.dir}/${artifact}`).exists();
      expect(exists).toBe(false);
    }
  });
});
