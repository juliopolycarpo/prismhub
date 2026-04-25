#!/usr/bin/env bun
/**
 * `bun verify` — final handoff gate. Runs sequentially, fails fast.
 *
 * Order:
 *   1. `bun run check`       — fast gates (typecheck, lint, format, unit, integration, etc.)
 *   2. `bun run build`       — full workspace build
 *   3. `bun run boundaries`  — turbo boundaries (no cycles, no missing deps)
 *
 * Stops at the first non-zero exit and propagates that exit code.
 *
 * Usage: bun scripts/verify.ts
 */
import { inheritSpawn } from './_lib/spawn';

export interface VerifyCommand {
  readonly name: string;
  readonly argv: readonly string[];
}

export const VERIFY_PLAN: readonly VerifyCommand[] = [
  { name: 'check', argv: ['bun', 'run', 'check'] },
  { name: 'build', argv: ['bun', 'run', 'build'] },
  { name: 'boundaries', argv: ['bun', 'run', 'boundaries'] },
];

export interface CommandRunResult {
  readonly name: string;
  readonly exitCode: number;
}

/**
 * Pure plan helper: returns the command sequence verify should run, in order.
 * Useful for tests so we don't shell out.
 */
export function getVerifyPlan(): readonly VerifyCommand[] {
  return VERIFY_PLAN;
}

/**
 * Pure helper: given a sequence of run results, returns the first non-zero
 * exit (or null if all passed). Tests can drive this without spawning.
 */
export function firstFailure(results: readonly CommandRunResult[]): CommandRunResult | null {
  for (const r of results) {
    if (r.exitCode !== 0) return r;
  }
  return null;
}

async function runCommand(cmd: VerifyCommand): Promise<CommandRunResult> {
  process.stdout.write(`\n▶ ${cmd.name}: ${cmd.argv.join(' ')}\n`);
  const exitCode = await inheritSpawn(cmd.argv);
  return { name: cmd.name, exitCode };
}

export async function runVerify(plan: readonly VerifyCommand[] = VERIFY_PLAN): Promise<number> {
  for (const cmd of plan) {
    const result = await runCommand(cmd);
    if (result.exitCode !== 0) {
      process.stderr.write(`\n✖ ${cmd.name} failed with exit code ${result.exitCode}.\n`);
      return result.exitCode;
    }
    process.stdout.write(`\n✓ ${cmd.name} passed.\n`);
  }
  process.stdout.write('\n✓ verify: all gates passed.\n');
  return 0;
}

if (import.meta.main) {
  process.exit(await runVerify());
}
