#!/usr/bin/env bun
import { rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '../..');
const WEB_DIST_RELATIVE_PATH = 'apps/web/dist';
const WEB_ASSETS_RELATIVE_PATH = 'packages/web-assets';
const FAIL_FAST_ERROR_NAME = 'DashboardNotBuiltError';

export interface WebAssetsFailFastPlan {
  readonly distPath: string;
  readonly parkedDistPath: string;
  readonly workdir: string;
  readonly command: readonly string[];
}

export interface CommandResult {
  readonly exitCode: number;
  readonly output: string;
}

export interface FailFastDecision {
  readonly ok: boolean;
  readonly reason?: string;
}

type BuildRunner = (plan: WebAssetsFailFastPlan) => Promise<CommandResult>;

export function createWebAssetsFailFastPlan(
  rootDir: string,
  nonce = `${Date.now()}-${process.pid}`,
): WebAssetsFailFastPlan {
  const distPath = resolve(rootDir, WEB_DIST_RELATIVE_PATH);

  return {
    distPath,
    parkedDistPath: `${distPath}.failfast-${nonce}`,
    workdir: resolve(rootDir, WEB_ASSETS_RELATIVE_PATH),
    command: [process.execPath, 'run', 'build'],
  };
}

export function decideWebAssetsFailFast(result: CommandResult): FailFastDecision {
  if (result.exitCode === 0) {
    return {
      ok: false,
      reason: 'web-assets build unexpectedly succeeded without apps/web/dist',
    };
  }

  if (!result.output.includes(FAIL_FAST_ERROR_NAME)) {
    return {
      ok: false,
      reason: `expected ${FAIL_FAST_ERROR_NAME} in failing web-assets build output`,
    };
  }

  return { ok: true };
}

async function spawnCaptured(command: readonly string[], cwd: string): Promise<CommandResult> {
  const proc = Bun.spawn([...command], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    exitCode,
    output: `${stdout}${stderr}`,
  };
}

async function cleanupDist(plan: WebAssetsFailFastPlan, movedDist: boolean): Promise<void> {
  await rm(plan.distPath, { force: true, recursive: true });
  if (movedDist) {
    await rename(plan.parkedDistPath, plan.distPath);
  }
}

export async function runWebAssetsFailFastCheck(
  plan: WebAssetsFailFastPlan,
  buildRunner: BuildRunner = ({ command, workdir }) => spawnCaptured(command, workdir),
): Promise<CommandResult> {
  let movedDist = false;

  try {
    await rename(plan.distPath, plan.parkedDistPath);
    movedDist = true;
  } catch {}

  try {
    return await buildRunner(plan);
  } finally {
    await cleanupDist(plan, movedDist);
  }
}

if (import.meta.main) {
  const plan = createWebAssetsFailFastPlan(REPO_ROOT);
  const result = await runWebAssetsFailFastCheck(plan);
  process.stdout.write(result.output);

  const decision = decideWebAssetsFailFast(result);
  if (!decision.ok) {
    process.stderr.write(`\n${decision.reason}\n`);
    process.exit(1);
  }

  process.stdout.write('\nweb-assets release build correctly fails without apps/web/dist.\n');
}
