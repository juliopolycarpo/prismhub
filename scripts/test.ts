#!/usr/bin/env bun
/**
 * Run the test suite. Flags:
 *   --unit          only unit tests (workspace test:unit + root scripts tests).
 *   --integration   only integration tests (workspace test:integration).
 *   --e2e           only end-to-end tests (workspace test:e2e).
 *   --no-artifacts  skip log/summary persistence (legacy stream-only mode).
 *   (none)          unit -> integration -> e2e.
 *
 * Artifacts: every run writes a structured `summary.json` plus per-suite
 * `<kind>.log.txt` under `.prismhub/tests/<runId>/results/`. The run id is
 * exposed to child processes via `PRISMHUB_TEST_RUN_ID`.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgv } from './_lib/argv';
import { getRunId } from './_lib/run-id';
import { inheritSpawn } from './_lib/spawn';
import { teeSpawn, REPO_ROOT } from './_lib/tee-spawn';
import { listRootScriptUnitTests } from './_lib/test-files';

const BUN = process.execPath;

type Mode = 'all' | 'unit' | 'integration' | 'e2e';
type Suite = 'unit' | 'integration' | 'e2e' | 'scripts-unit';

interface SuiteRecord {
  readonly kind: Suite;
  readonly exitCode: number;
  readonly durationMs: number;
  readonly logPath: string;
  readonly command: readonly string[];
}

function resolveMode(flags: ReadonlySet<string>): Mode {
  if (flags.has('unit')) return 'unit';
  if (flags.has('integration')) return 'integration';
  if (flags.has('e2e')) return 'e2e';
  return 'all';
}

function turboTaskFor(mode: Exclude<Mode, 'all'>): 'test:unit' | 'test:integration' | 'test:e2e' {
  if (mode === 'unit') return 'test:unit';
  if (mode === 'integration') return 'test:integration';
  return 'test:e2e';
}

interface RunContext {
  readonly runId: string;
  readonly resultsDir: string;
  readonly env: Record<string, string>;
  readonly suites: SuiteRecord[];
}

function createRunContext(): RunContext {
  const runId = getRunId();
  const resultsDir = resolve(REPO_ROOT, '.prismhub/tests', runId, 'results');
  mkdirSync(resultsDir, { recursive: true });
  return { runId, resultsDir, env: { PRISMHUB_TEST_RUN_ID: runId }, suites: [] };
}

async function runWorkspaceSuite(
  ctx: RunContext,
  mode: Exclude<Mode, 'all'>,
  kind: Suite,
): Promise<number> {
  const command = [BUN, 'x', 'turbo', 'run', turboTaskFor(mode)];
  const logPath = resolve(ctx.resultsDir, `${kind}.log.txt`);
  const result = await teeSpawn(command, logPath, ctx.env);
  ctx.suites.push({
    kind,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    logPath,
    command,
  });
  return result.exitCode;
}

async function runRootScriptsSuite(ctx: RunContext): Promise<number> {
  const files = await listRootScriptUnitTests();
  if (files.length === 0) return 0;
  const command = [BUN, 'test', ...files];
  const logPath = resolve(ctx.resultsDir, 'scripts-unit.log.txt');
  const result = await teeSpawn(command, logPath, ctx.env);
  ctx.suites.push({
    kind: 'scripts-unit',
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    logPath,
    command,
  });
  return result.exitCode;
}

async function runUnit(ctx: RunContext): Promise<number> {
  const workspace = await runWorkspaceSuite(ctx, 'unit', 'unit');
  if (workspace !== 0) return workspace;
  return runRootScriptsSuite(ctx);
}

async function writeSummary(
  ctx: RunContext,
  startedAt: string,
  finishedAt: string,
  exitCode: number,
): Promise<string> {
  const summary = {
    runId: ctx.runId,
    startedAt,
    finishedAt,
    exitCode,
    suites: ctx.suites,
  };
  const summaryPath = resolve(ctx.resultsDir, 'summary.json');
  await Bun.write(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  return summaryPath;
}

async function dispatch(ctx: RunContext, mode: Mode): Promise<number> {
  if (mode !== 'all') {
    if (mode === 'unit') return runUnit(ctx);
    return runWorkspaceSuite(ctx, mode, mode);
  }

  const unit = await runUnit(ctx);
  if (unit !== 0) return unit;
  const integration = await runWorkspaceSuite(ctx, 'integration', 'integration');
  if (integration !== 0) return integration;
  return runWorkspaceSuite(ctx, 'e2e', 'e2e');
}

async function runLegacy(mode: Mode): Promise<number> {
  if (mode !== 'all') {
    if (mode === 'unit') {
      const workspace = await inheritSpawn([BUN, 'x', 'turbo', 'run', 'test:unit']);
      if (workspace !== 0) return workspace;
      const files = await listRootScriptUnitTests();
      if (files.length === 0) return 0;
      return inheritSpawn([BUN, 'test', ...files]);
    }
    return inheritSpawn([BUN, 'x', 'turbo', 'run', turboTaskFor(mode)]);
  }

  const unit = await inheritSpawn([BUN, 'x', 'turbo', 'run', 'test:unit']);
  if (unit !== 0) return unit;
  const files = await listRootScriptUnitTests();
  if (files.length > 0) {
    const scripts = await inheritSpawn([BUN, 'test', ...files]);
    if (scripts !== 0) return scripts;
  }
  const integration = await inheritSpawn([BUN, 'x', 'turbo', 'run', 'test:integration']);
  if (integration !== 0) return integration;
  return inheritSpawn([BUN, 'x', 'turbo', 'run', 'test:e2e']);
}

async function main(): Promise<number> {
  const args = parseArgv(process.argv.slice(2));
  const mode = resolveMode(args.flags);

  if (args.flags.has('no-artifacts')) return runLegacy(mode);

  const ctx = createRunContext();
  const startedAt = new Date().toISOString();
  const exitCode = await dispatch(ctx, mode);
  const finishedAt = new Date().toISOString();
  const summaryPath = await writeSummary(ctx, startedAt, finishedAt, exitCode);

  process.stdout.write(`\nTest artifacts: ${summaryPath}\n`);
  return exitCode;
}

if (import.meta.main) {
  process.exit(await main());
}
