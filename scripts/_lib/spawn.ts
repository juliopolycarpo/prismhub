import { resolve } from 'node:path';

export const REPO_ROOT = resolve(import.meta.dir, '../..');

export function bunxCommand(command: string, args: readonly string[] = []): readonly string[] {
  return [process.execPath, 'x', command, ...args];
}

export function turboRunCommand(
  task: string,
  passthrough: readonly string[] = [],
  prefix: readonly string[] = [],
): readonly string[] {
  return bunxCommand('turbo', ['run', task, ...prefix, ...passthrough]);
}

export function withoutFlags(
  argv: readonly string[],
  flags: ReadonlySet<string>,
): readonly string[] {
  return argv.filter((arg) => !flags.has(arg));
}

export async function runTurboTask(
  task: string,
  passthrough: readonly string[] = [],
  prefix: readonly string[] = [],
): Promise<number> {
  return inheritSpawn(turboRunCommand(task, passthrough, prefix));
}

/**
 * Spawns a child process that inherits stdio, so the user sees live output.
 * Forwards SIGINT/SIGTERM/SIGHUP to the child so CI cancellations and Ctrl-C
 * propagate correctly (otherwise turbo/runtime children orphan).
 * Returns the exit code; callers typically `process.exit(code)` after.
 */
export async function inheritSpawn(command: readonly string[]): Promise<number> {
  const proc = Bun.spawn([...command], {
    cwd: REPO_ROOT,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const forwarded: readonly NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  const forward = (signal: NodeJS.Signals): void => {
    proc.kill(signal);
  };
  const handlers = forwarded.map((signal) => {
    const handler = (): void => forward(signal);
    process.on(signal, handler);
    return [signal, handler] as const;
  });
  try {
    return await proc.exited;
  } finally {
    for (const [signal, handler] of handlers) {
      process.off(signal, handler);
    }
  }
}
