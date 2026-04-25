export interface PrettierCheckResult {
  readonly unformatted: number;
  readonly files: readonly string[];
}

const WARN_LINE = /^\[warn\]\s+(.+)$/gm;
const SUMMARY_LINE = /Code style issues found in (\d+) files?/;

/**
 * Parses `prettier . --check` output. Collects per-file warnings and (when
 * present) reconciles against the trailing summary line. Returns
 * `unformatted: 0` for clean runs.
 */
export function parsePrettierCheck(
  stderrOutput: string,
  stdoutOutput: string,
): PrettierCheckResult {
  const combined = `${stderrOutput}\n${stdoutOutput}`;
  const files: string[] = [];

  for (const match of combined.matchAll(WARN_LINE)) {
    const raw = match[1]?.trim() ?? '';
    if (!raw || raw.startsWith('Code style')) continue;
    files.push(raw);
  }

  const summary = combined.match(SUMMARY_LINE);
  const fromSummary = summary ? Number.parseInt(summary[1] ?? '0', 10) : 0;
  const unformatted = fromSummary > 0 ? fromSummary : files.length;

  return { unformatted, files };
}
