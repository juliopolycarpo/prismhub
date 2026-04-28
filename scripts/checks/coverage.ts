#!/usr/bin/env bun
/**
 * Runs `bun test --coverage` and enforces line-coverage thresholds.
 *
 * Fail-closed semantics:
 *  - Any non-zero subprocess exit fails the run, even if a coverage summary is present.
 *  - A missing or malformed summary for any configured layer fails the run.
 *  - There is no `skipIfNoSummary`: every configured layer must produce a summary.
 *
 * Usage: bun scripts/checks/coverage.ts
 */
import { $ } from 'bun';

import { GLOBAL_THRESHOLD, LAYER_THRESHOLDS, type LayerConfig } from '../_lib/coverage-config';

export { GLOBAL_THRESHOLD, LAYER_THRESHOLDS, type LayerConfig };

export interface CoverageRunResult {
  readonly label: string;
  readonly exitCode: number;
  readonly output: string;
  readonly coverage: number | null;
}

export function parseCoverageOutput(output: string): number | null {
  const match = output.match(/All files\s*\|\s*[\d.]+\s*\|\s*([\d.]+)\s*\|/);
  if (!match) return null;
  const lines = parseFloat(match[1] ?? '0');
  return Number.isFinite(lines) ? lines : null;
}

/**
 * Computes line-coverage percentage for files whose path starts with `src/`
 * only. Avoids inflating per-layer numbers with transitive workspace-dep
 * source files (which appear as `../other-pkg/src/…` when bun test runs from
 * a package directory).
 */
export function parsePackageSrcCoverage(output: string): number | null {
  const coverages: number[] = [];
  for (const line of output.split('\n')) {
    if (!/^\s+src\//.test(line)) continue;
    const match = line.match(/\|\s*[\d.]+\s*\|\s*([\d.]+)\s*\|/);
    if (!match) continue;
    const pct = parseFloat(match[1] ?? '');
    if (Number.isFinite(pct)) coverages.push(pct);
  }
  if (coverages.length === 0) return null;
  return coverages.reduce((sum, v) => sum + v, 0) / coverages.length;
}

export interface CoverageDecision {
  readonly ok: boolean;
  readonly reason?: string;
}

export function decideCoverageRun(result: CoverageRunResult, threshold: number): CoverageDecision {
  if (result.exitCode !== 0) {
    return {
      ok: false,
      reason: `${result.label}: subprocess exited with code ${result.exitCode}`,
    };
  }
  if (result.coverage === null) {
    return {
      ok: false,
      reason: `${result.label}: coverage summary absent or malformed`,
    };
  }
  if (result.coverage < threshold) {
    return {
      ok: false,
      reason: `${result.label}: ${result.coverage.toFixed(1)}% < ${threshold}% required`,
    };
  }
  return { ok: true };
}

if (import.meta.main) {
  // ── Step 1: Global coverage ────────────────────────────────────────────────
  // Includes packages/, apps/runtime/, and root scripts/ (excludes apps/web,
  // which needs its own DOM preload and is measured per-layer).
  const globalRun =
    await $`bun test --coverage --coverage-reporter=text packages apps/runtime scripts`
      .quiet()
      .nothrow();
  const globalStdout = globalRun.stdout.toString();
  const globalStderr = globalRun.stderr.toString();
  const globalOutput = `${globalStdout}${globalStderr}`;
  process.stdout.write(globalStdout);
  if (globalStderr) process.stderr.write(globalStderr);

  const globalResult: CoverageRunResult = {
    label: 'global',
    exitCode: globalRun.exitCode ?? 0,
    output: globalOutput,
    coverage: parseCoverageOutput(globalOutput),
  };

  const globalDecision = decideCoverageRun(globalResult, GLOBAL_THRESHOLD);
  if (!globalDecision.ok) {
    process.stderr.write(`\nGlobal coverage failed: ${globalDecision.reason}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `Global coverage ${(globalResult.coverage ?? 0).toFixed(1)}% meets threshold ${GLOBAL_THRESHOLD}%.\n\n`,
  );

  // ── Step 2: Per-layer coverage ─────────────────────────────────────────────
  process.stdout.write('Per-layer coverage checks:\n');

  const layerResults = await Promise.all(
    LAYER_THRESHOLDS.map(
      async (layer): Promise<{ layer: LayerConfig; result: CoverageRunResult }> => {
        const run = await $`bun test --coverage --coverage-reporter=text`
          .cwd(layer.dir)
          .quiet()
          .nothrow();
        const output = `${run.stdout.toString()}${run.stderr.toString()}`;
        const coverage = parsePackageSrcCoverage(output) ?? parseCoverageOutput(output);
        return {
          layer,
          result: {
            label: layer.dir,
            exitCode: run.exitCode ?? 0,
            output,
            coverage,
          },
        };
      },
    ),
  );

  let layerViolations = 0;

  for (const { layer, result } of layerResults) {
    const decision = decideCoverageRun(result, layer.threshold);
    if (!decision.ok) {
      process.stderr.write(`  FAIL  ${decision.reason}\n`);
      layerViolations++;
      continue;
    }
    process.stdout.write(
      `  ok    ${layer.dir}: ${(result.coverage ?? 0).toFixed(1)}% ≥ ${layer.threshold}%\n`,
    );
  }

  if (layerViolations > 0) {
    process.stderr.write(`\n${layerViolations} layer(s) failed coverage gate.\n`);
    process.exit(1);
  }

  process.stdout.write('\nAll layer thresholds met.\n');
  process.exit(0);
}
