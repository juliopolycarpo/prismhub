export interface ChecklistRow {
  readonly passed: boolean;
  readonly label: string;
  readonly durationMs?: number;
}

export interface FailureBlock {
  readonly name: string;
  readonly output: string;
}

const CHECK = '[x]';
const UNCHECK = '[ ]';
const SEP = '─'.repeat(42);

export function renderChecklist(rows: readonly ChecklistRow[]): string {
  return rows.map((row) => `${row.passed ? CHECK : UNCHECK} ${row.label}`).join('\n');
}

export function renderFailures(failures: readonly FailureBlock[]): string {
  if (failures.length === 0) return '';
  const blocks = failures.map((f) => `▸ ${f.name}\n${f.output.trimEnd()}`);
  return `\nAbove failed:\n\n${blocks.join(`\n\n${SEP}\n\n`)}\n`;
}

export function renderFullOutput(blocks: readonly FailureBlock[]): string {
  if (blocks.length === 0) return '';
  const lines = blocks.map((b) => `${SEP}\n${b.name}\n${SEP}\n${b.output.trimEnd()}`);
  return `\n${lines.join('\n\n')}\n`;
}

export interface FooterOptions {
  readonly totalGates: number;
  readonly passedGates: number;
  readonly elapsedMs: number;
  readonly mode: 'resume' | 'full';
}

export function renderFooter(opts: FooterOptions): string {
  const failed = opts.totalGates - opts.passedGates;
  const seconds = (opts.elapsedMs / 1000).toFixed(1);

  if (failed === 0) {
    return `${SEP}\n${opts.totalGates} of ${opts.totalGates} gates passed.  (${seconds}s total)`;
  }

  const hint = opts.mode === 'resume' ? '  Run `bun check --full` for complete output.' : '';
  return `${SEP}\n${failed} of ${opts.totalGates} gates failed.  (${seconds}s total)${hint}`;
}
