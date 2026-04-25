#!/usr/bin/env bun
/**
 * `bun check` — parallel gate orchestrator.
 *
 * Flags:
 *   --resume  (default) prints a concise checklist; only failing gates dump
 *             their captured output.
 *   --full    prints the checklist plus captured output for every gate.
 *
 * Exit code: 0 only when all gates pass. Exit code is the single source of
 * truth for gate pass/fail; parsed counts are best-effort for the checklist.
 */
import { resolve } from 'node:path';

import { parseArgv } from './_lib/argv';
import { renderChecklist, renderFailures, renderFooter, renderFullOutput } from './_lib/format';
import { runGate, type GateResult } from './_lib/gate';
import { ALL_GATES } from './_lib/gates';

const REPO_ROOT = resolve(import.meta.dir, '..');
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

type CheckMode = 'resume' | 'full';

function resolveMode(flags: ReadonlySet<string>): CheckMode {
  return flags.has('full') ? 'full' : 'resume';
}

function resolveTimeoutMs(raw: string | undefined): number {
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

function buildChildEnv(): Readonly<Record<string, string>> {
  // Deterministic env so captured output parses the same locally and in CI.
  return {
    TZ: 'UTC',
    NO_COLOR: '1',
    FORCE_COLOR: '0',
    CI: process.env.CI ?? '',
  };
}

function printReport(results: readonly GateResult[], mode: CheckMode, elapsedMs: number): void {
  const rows = results.map((r) => ({
    passed: r.passed,
    label: r.passed ? r.passedLabel : r.failedLabel,
  }));

  process.stdout.write(`${renderChecklist(rows)}\n`);

  if (mode === 'full') {
    process.stdout.write(
      renderFullOutput(results.map((r) => ({ name: r.name, output: r.output }))),
    );
  } else {
    const failures = results
      .filter((r) => !r.passed)
      .map((r) => ({ name: r.name, output: r.output }));
    process.stdout.write(renderFailures(failures));
  }

  const passed = results.filter((r) => r.passed).length;
  process.stdout.write(
    `\n${renderFooter({ totalGates: results.length, passedGates: passed, elapsedMs, mode })}\n`,
  );
}

async function main(): Promise<number> {
  const args = parseArgv(process.argv.slice(2));
  const mode = resolveMode(args.flags);
  const timeoutMs = resolveTimeoutMs(process.env.PRISMHUB_CHECK_TIMEOUT_MS);
  const env = buildChildEnv();

  process.stdout.write(`Prismhub check — ${ALL_GATES.length} gates in parallel (${mode})...\n\n`);

  const start = performance.now();
  const results = await Promise.all(
    ALL_GATES.map((gate) => runGate(gate, { repoRoot: REPO_ROOT, env, timeoutMs })),
  );
  const elapsedMs = performance.now() - start;

  printReport(results, mode, elapsedMs);

  return results.every((r) => r.passed) ? 0 : 1;
}

if (import.meta.main) {
  process.exit(await main());
}
