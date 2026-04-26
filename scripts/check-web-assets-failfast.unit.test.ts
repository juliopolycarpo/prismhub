import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createWebAssetsFailFastPlan,
  decideWebAssetsFailFast,
  runWebAssetsFailFastCheck,
} from './check-web-assets-failfast.ts';

const tempDirs: string[] = [];

function makeTempRepo(): string {
  const root = mkdtempSync(join(tmpdir(), 'prismhub-web-assets-failfast-'));
  tempDirs.push(root);
  mkdirSync(join(root, 'apps/web'), { recursive: true });
  mkdirSync(join(root, 'packages/web-assets'), { recursive: true });
  return root;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe('createWebAssetsFailFastPlan()', () => {
  test('targets apps/web/dist and packages/web-assets build', () => {
    const plan = createWebAssetsFailFastPlan('/repo', 'case');

    expect(plan.distPath).toBe('/repo/apps/web/dist');
    expect(plan.parkedDistPath).toBe('/repo/apps/web/dist.failfast-case');
    expect(plan.workdir).toBe('/repo/packages/web-assets');
    expect(plan.command).toEqual([process.execPath, 'run', 'build']);
  });
});

describe('runWebAssetsFailFastCheck()', () => {
  test('restores an existing dashboard dist after the check', async () => {
    const root = makeTempRepo();
    const distDir = join(root, 'apps/web/dist');
    const marker = join(distDir, 'index.html');
    mkdirSync(distDir, { recursive: true });
    await Bun.write(marker, 'built');
    const plan = createWebAssetsFailFastPlan(root, 'restore');

    const result = await runWebAssetsFailFastCheck(plan, async () => ({
      exitCode: 1,
      output: 'DashboardNotBuiltError',
    }));

    expect(result.exitCode).toBe(1);
    expect(await Bun.file(marker).text()).toBe('built');
    expect(existsSync(plan.parkedDistPath)).toBe(false);
  });

  test('removes dist created during the check when it was absent initially', async () => {
    const root = makeTempRepo();
    const plan = createWebAssetsFailFastPlan(root, 'cleanup');

    await runWebAssetsFailFastCheck(plan, async (currentPlan) => {
      mkdirSync(currentPlan.distPath, { recursive: true });
      await Bun.write(join(currentPlan.distPath, 'index.html'), 'new dist');
      return {
        exitCode: 1,
        output: 'DashboardNotBuiltError',
      };
    });

    expect(existsSync(plan.distPath)).toBe(false);
    expect(existsSync(plan.parkedDistPath)).toBe(false);
  });

  test('restores dist even when the build runner throws', async () => {
    const root = makeTempRepo();
    const distDir = join(root, 'apps/web/dist');
    const marker = join(distDir, 'index.html');
    mkdirSync(distDir, { recursive: true });
    await Bun.write(marker, 'built');
    const plan = createWebAssetsFailFastPlan(root, 'throw');

    await expect(
      runWebAssetsFailFastCheck(plan, async () => {
        throw new Error('runner failed');
      }),
    ).rejects.toThrow('runner failed');

    expect(await Bun.file(marker).text()).toBe('built');
    expect(existsSync(plan.parkedDistPath)).toBe(false);
  });
});

describe('decideWebAssetsFailFast()', () => {
  test('fails when the build unexpectedly succeeds', () => {
    const decision = decideWebAssetsFailFast({ exitCode: 0, output: '' });

    expect(decision.ok).toBe(false);
    expect(decision.reason).toContain('unexpectedly succeeded');
  });

  test('fails when the expected error name is missing', () => {
    const decision = decideWebAssetsFailFast({ exitCode: 1, output: 'generic error' });

    expect(decision.ok).toBe(false);
    expect(decision.reason).toContain('DashboardNotBuiltError');
  });

  test('passes when the build fails with DashboardNotBuiltError', () => {
    expect(decideWebAssetsFailFast({ exitCode: 1, output: 'DashboardNotBuiltError' })).toEqual({
      ok: true,
    });
  });
});
