export interface GateContext {
  readonly signal: AbortSignal;
  readonly repoRoot: string;
  readonly env: Readonly<Record<string, string>>;
}

export interface GateOutcome {
  readonly passed: boolean;
  readonly passedLabel: string;
  readonly failedLabel: string;
  readonly output: string;
}

export interface Gate {
  readonly name: string;
  readonly run: (ctx: GateContext) => Promise<GateOutcome>;
}

export interface GateResult extends GateOutcome {
  readonly name: string;
  readonly durationMs: number;
  readonly timedOut: boolean;
}

export class GateTimeoutError extends Error {
  constructor(
    readonly gateName: string,
    readonly timeoutMs: number,
  ) {
    super(`Gate ${gateName} timed out after ${timeoutMs}ms`);
    this.name = 'GateTimeoutError';
  }
}

export interface GateRunOptions {
  readonly repoRoot: string;
  readonly env: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
}

export async function runGate(gate: Gate, opts: GateRunOptions): Promise<GateResult> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new GateTimeoutError(gate.name, opts.timeoutMs)),
    opts.timeoutMs,
  );
  const start = performance.now();

  try {
    const outcome = await gate.run({
      signal: controller.signal,
      repoRoot: opts.repoRoot,
      env: opts.env,
    });
    const elapsed = performance.now() - start;
    // spawnCaptured swallows SIGTERM (child just exits non-zero), so gate.run()
    // may resolve normally even after a timeout fired. Re-check the signal to
    // report the correct reason.
    if (controller.signal.aborted && controller.signal.reason instanceof GateTimeoutError) {
      return buildTimeoutResult(gate.name, opts.timeoutMs, outcome.output, elapsed);
    }
    return { ...outcome, name: gate.name, durationMs: elapsed, timedOut: false };
  } catch (err) {
    const elapsed = performance.now() - start;
    if (controller.signal.aborted && controller.signal.reason instanceof GateTimeoutError) {
      const partialOutput = err instanceof Error ? (err.stack ?? err.message) : String(err);
      return buildTimeoutResult(gate.name, opts.timeoutMs, partialOutput, elapsed);
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      name: gate.name,
      passed: false,
      passedLabel: '',
      failedLabel: `${gate.name} crashed: ${message}`,
      output: err instanceof Error ? (err.stack ?? message) : message,
      durationMs: elapsed,
      timedOut: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildTimeoutResult(
  name: string,
  timeoutMs: number,
  output: string,
  durationMs: number,
): GateResult {
  const seconds = timeoutMs >= 1000 ? `${Math.round(timeoutMs / 1000)}s` : `${timeoutMs}ms`;
  return {
    name,
    passed: false,
    passedLabel: '',
    failedLabel: `${name} timed out after ${seconds}`,
    output,
    durationMs,
    timedOut: true,
  };
}

export interface SpawnCaptureResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface SpawnCaptureOptions {
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  readonly signal: AbortSignal;
}

export async function spawnCaptured(
  cmd: readonly string[],
  opts: SpawnCaptureOptions,
): Promise<SpawnCaptureResult> {
  const proc = Bun.spawn([...cmd], {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const onAbort = (): void => {
    proc.kill('SIGTERM');
  };
  opts.signal.addEventListener('abort', onAbort, { once: true });

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { exitCode, stdout, stderr };
  } finally {
    opts.signal.removeEventListener('abort', onAbort);
  }
}

export function joinOutput(result: SpawnCaptureResult): string {
  return [result.stdout, result.stderr].filter((s) => s.length > 0).join('\n');
}
