export interface EslintCounts {
  readonly errors: number;
  readonly warnings: number;
  readonly files: number;
  readonly filesWithProblems: number;
}

interface EslintFileResult {
  readonly filePath?: string;
  readonly errorCount?: number;
  readonly warningCount?: number;
}

/**
 * Parses ESLint JSON output (`--format=json`). Returns null when the input is
 * not valid JSON or not the array shape ESLint produces — caller falls back to
 * the process exit code.
 */
export function parseEslintJson(raw: string): EslintCounts | null {
  const parsed = safeJsonParse(raw);
  if (!Array.isArray(parsed)) return null;

  let errors = 0;
  let warnings = 0;
  let filesWithProblems = 0;

  for (const entry of parsed as readonly EslintFileResult[]) {
    const e = entry.errorCount ?? 0;
    const w = entry.warningCount ?? 0;
    errors += e;
    warnings += w;
    if (e + w > 0) filesWithProblems++;
  }

  return { errors, warnings, files: parsed.length, filesWithProblems };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
