import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { REPO_ROOT } from './spawn';

export interface TeeSpawnResult {
  readonly exitCode: number;
  readonly durationMs: number;
}

/**
 * Spawns a child process that echoes its stdout/stderr live to the parent
 * terminal while also writing every byte to `logPath`. Used by the test
 * runner to persist per-suite logs without sacrificing real-time visibility.
 */
export async function teeSpawn(
  command: readonly string[],
  logPath: string,
  extraEnv: Readonly<Record<string, string>> = {},
): Promise<TeeSpawnResult> {
  mkdirSync(dirname(logPath), { recursive: true });
  const sink = Bun.file(logPath).writer();
  const startedAt = Date.now();

  const proc = Bun.spawn([...command], {
    cwd: REPO_ROOT,
    stdin: 'inherit',
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...Bun.env, ...extraEnv },
  });

  await Promise.all([
    forward(proc.stdout, process.stdout, sink),
    forward(proc.stderr, process.stderr, sink),
  ]);
  const exitCode = await proc.exited;
  await sink.flush();
  sink.end();

  return { exitCode, durationMs: Date.now() - startedAt };
}

type BunWriter = ReturnType<ReturnType<typeof Bun.file>['writer']>;

async function forward(
  source: ReadableStream<Uint8Array>,
  primary: NodeJS.WriteStream,
  secondary: BunWriter,
): Promise<void> {
  const reader = source.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    primary.write(value);
    secondary.write(Buffer.from(value));
  }
}

export { REPO_ROOT };
