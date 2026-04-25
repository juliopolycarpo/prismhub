#!/usr/bin/env bun
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

export const ROOT_ARTIFACTS = [
  'dist',
  'coverage',
  '.turbo',
  'scripts/tsconfig.tsbuildinfo',
] as const;

export interface CleanPlan {
  readonly rootArtifacts: readonly string[];
  readonly turboCommand: string[];
}

const REPO_ROOT = resolve(import.meta.dir, '..');

export function createCleanPlan(rootDir: string, args: readonly string[]): CleanPlan {
  return {
    rootArtifacts: ROOT_ARTIFACTS.map((artifact) => resolve(rootDir, artifact)),
    turboCommand: [process.execPath, 'x', 'turbo', 'run', 'clean', ...args],
  };
}

async function runTurboClean(command: string[]): Promise<number> {
  const turboProcess = Bun.spawn(command, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  return await turboProcess.exited;
}

async function removeRootArtifacts(paths: readonly string[]): Promise<void> {
  await Promise.all(paths.map(async (path) => rm(path, { force: true, recursive: true })));
}

if (import.meta.main) {
  const plan = createCleanPlan(REPO_ROOT, process.argv.slice(2));
  const exitCode = await runTurboClean(plan.turboCommand);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  await removeRootArtifacts(plan.rootArtifacts);
}
