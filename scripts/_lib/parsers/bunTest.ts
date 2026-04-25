export interface BunTestCounts {
  readonly passed: number;
  readonly failed: number;
  readonly total: number;
  readonly files: number;
}

// Patterns are intentionally not anchored to `^` so they still match when
// turbo prefixes each line with `<pkg>:test:`. The `\b` guard prevents
// mid-number matches.
const PASS_LINE = /\b(\d+)\s+pass\s*$/gm;
const FAIL_LINE = /\b(\d+)\s+fail\s*$/gm;
const RAN_LINE = /Ran\s+(\d+)\s+tests?\s+across\s+(\d+)\s+files?/g;

// Strip ANSI colour/style escapes. Bun test colours its summary line even
// under NO_COLOR when turbo attaches its TUI pipe — so we normalise here
// rather than relying on the child to honour colour env vars.
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\x1b\[[0-9;]*m/g;

/**
 * Parses aggregated `bun test` counts from combined stdout+stderr of one or
 * more bun-test invocations (e.g., turbo runs each workspace, each printing
 * its own summary). Returns null only when no recognisable summary is found —
 * callers should treat null as "counts unavailable" and rely on exit code for
 * pass/fail.
 */
export function parseBunTestCounts(output: string): BunTestCounts | null {
  const clean = output.replace(ANSI_ESCAPE, '');
  let passed = 0;
  let failed = 0;
  let ran = 0;
  let files = 0;
  let seen = false;

  for (const match of clean.matchAll(PASS_LINE)) {
    passed += Number.parseInt(match[1] ?? '0', 10);
    seen = true;
  }
  for (const match of clean.matchAll(FAIL_LINE)) {
    failed += Number.parseInt(match[1] ?? '0', 10);
    seen = true;
  }
  for (const match of clean.matchAll(RAN_LINE)) {
    ran += Number.parseInt(match[1] ?? '0', 10);
    files += Number.parseInt(match[2] ?? '0', 10);
    seen = true;
  }

  if (!seen) return null;

  // Denominator is passed+failed (what actually ran to conclusion); skip/todo
  // tests are excluded so "28/28 passed" reads intuitively. `ran` from the
  // "Ran X tests" line may include skipped/todo and is kept only for files.
  const denominator = passed + failed > 0 ? passed + failed : ran;
  return { passed, failed, total: denominator, files };
}
