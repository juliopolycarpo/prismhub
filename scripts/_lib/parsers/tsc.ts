export interface TscCounts {
  readonly errors: number;
  readonly files: number;
}

const FOUND_SUMMARY = /Found\s+(\d+)\s+errors?(?:\s+in\s+(\d+)\s+files?)?/;
const ERROR_LINE = /:\s+error\s+TS\d+:/g;

/**
 * Counts TypeScript diagnostics from tsc output. tsc writes a summary line
 * "Found N errors in M files." on completion; when absent (e.g. in pretty-off
 * mode with truncated output), falls back to counting `error TS` occurrences.
 */
export function parseTscOutput(output: string): TscCounts {
  const summary = output.match(FOUND_SUMMARY);
  if (summary) {
    const errors = Number.parseInt(summary[1] ?? '0', 10);
    const files = summary[2] ? Number.parseInt(summary[2], 10) : 0;
    return { errors, files };
  }
  const matches = output.match(ERROR_LINE);
  return { errors: matches?.length ?? 0, files: 0 };
}
