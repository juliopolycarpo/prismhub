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
import { inheritSpawn, turboRunCommand } from './_lib/spawn';
import { teeSpawn, REPO_ROOT } from './_lib/tee-spawn';
import { listRootScriptUnitTests } from './_lib/test-files';

type Mode = 'all' | 'unit' | 'integration' | 'e2e';
type Suite = 'unit' | 'integration' | 'e2e' | 'scripts-unit';
type TurboTestTask = 'test:unit' | 'test:integration' | 'test:e2e';

interface SuiteRecord {
  readonly kind: Suite;
  readonly exitCode: number;
  readonly durationMs: number;
  readonly logPath: string;
  readonly command: readonly string[];
  /**
   * True when the underlying turbo task short-circuited via cache or had no
   * tests to run. Surfaced in `summary.json` so successful zero-test runs
   * are visible instead of looking identical to a real pass.
   */
  readonly cached: boolean;
}

function resolveMode(flags: ReadonlySet<string>): Mode {
  if (flags.has('unit')) return 'unit';
  if (flags.has('integration')) return 'integration';
  if (flags.has('e2e')) return 'e2e';
  return 'all';
}

function turboTaskFor(mode: Exclude<Mode, 'all'>): TurboTestTask {
  if (mode === 'unit') return 'test:unit';
  if (mode === 'integration') return 'test:integration';
  return 'test:e2e';
}

export function turboRunTestCommand(
  task: TurboTestTask,
  turboConcurrency: string | undefined,
): readonly string[] {
  return turboRunCommand(task, [], turboConcurrency ? [`--concurrency=${turboConcurrency}`] : []);
}

interface RunContext {
  readonly runId: string;
  readonly resultsDir: string;
  readonly env: Record<string, string>;
  readonly suites: SuiteRecord[];
  readonly turboConcurrency: string | undefined;
}

function createRunContext(turboConcurrency: string | undefined): RunContext {
  const runId = getRunId();
  const resultsDir = resolve(REPO_ROOT, '.prismhub/tests', runId, 'results');
  mkdirSync(resultsDir, { recursive: true });
  return {
    runId,
    resultsDir,
    env: { PRISMHUB_TEST_RUN_ID: runId },
    suites: [],
    turboConcurrency,
  };
}

async function runWorkspaceSuite(
  ctx: RunContext,
  mode: Exclude<Mode, 'all'>,
  kind: Suite,
): Promise<number> {
  const command = turboRunTestCommand(turboTaskFor(mode), ctx.turboConcurrency);
  const logPath = resolve(ctx.resultsDir, `${kind}.log.txt`);
  const result = await teeSpawn(command, logPath, ctx.env);
  ctx.suites.push({
    kind,
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    logPath,
    command,
    cached: await detectCachedRun(logPath),
  });
  return result.exitCode;
}

async function runRootScriptsSuite(ctx: RunContext): Promise<number> {
  const files = await listRootScriptUnitTests();
  if (files.length === 0) return 0;
  const command = [process.execPath, 'test', ...files];
  const logPath = resolve(ctx.resultsDir, 'scripts-unit.log.txt');
  const result = await teeSpawn(command, logPath, ctx.env);
  ctx.suites.push({
    kind: 'scripts-unit',
    exitCode: result.exitCode,
    durationMs: result.durationMs,
    logPath,
    command,
    cached: false,
  });
  return result.exitCode;
}

/**
 * Heuristic: turbo prints lines like "cache hit, replaying logs" or
 * "cache hit, suppressing logs" when a task short-circuits. Reads the
 * captured log once after the run; missing or unreadable logs return false.
 */
async function detectCachedRun(logPath: string): Promise<boolean> {
  try {
    const text = await Bun.file(logPath).text();
    return /cache hit/i.test(text);
  } catch {
    return false;
  }
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

async function runLegacy(mode: Mode, turboConcurrency: string | undefined): Promise<number> {
  if (mode !== 'all') {
    if (mode === 'unit') {
      const workspace = await inheritSpawn(turboRunTestCommand('test:unit', turboConcurrency));
      if (workspace !== 0) return workspace;
      const files = await listRootScriptUnitTests();
      if (files.length === 0) return 0;
      return inheritSpawn([process.execPath, 'test', ...files]);
    }
    return inheritSpawn(turboRunTestCommand(turboTaskFor(mode), turboConcurrency));
  }

  const unit = await inheritSpawn(turboRunTestCommand('test:unit', turboConcurrency));
  if (unit !== 0) return unit;
  const files = await listRootScriptUnitTests();
  if (files.length > 0) {
    const scripts = await inheritSpawn([process.execPath, 'test', ...files]);
    if (scripts !== 0) return scripts;
  }
  const integration = await inheritSpawn(turboRunTestCommand('test:integration', turboConcurrency));
  if (integration !== 0) return integration;
  return inheritSpawn(turboRunTestCommand('test:e2e', turboConcurrency));
}

async function main(): Promise<number> {
  const args = parseArgv(process.argv.slice(2));
  const mode = resolveMode(args.flags);
  const turboConcurrency = args.options.get('turbo-concurrency');

  if (args.flags.has('no-artifacts')) return runLegacy(mode, turboConcurrency);

  const ctx = createRunContext(turboConcurrency);
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
