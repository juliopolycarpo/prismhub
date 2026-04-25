export interface PidfileRecord {
  readonly pid: number;
  readonly host: string;
  readonly port: number;
  readonly startedAt: string;
  readonly version: string;
}

export class AlreadyRunningError extends Error {
  constructor(public readonly record: PidfileRecord) {
    super(`Prismhub already running with pid ${record.pid}`);
    this.name = 'AlreadyRunningError';
  }
}

export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EPERM') return true;
    return false;
  }
}

export async function readPidfile(path: string): Promise<PidfileRecord | undefined> {
  try {
    const raw = await Bun.file(path).text();
    const parsed = JSON.parse(raw) as Partial<PidfileRecord>;
    if (
      typeof parsed.pid !== 'number' ||
      typeof parsed.host !== 'string' ||
      typeof parsed.port !== 'number' ||
      typeof parsed.startedAt !== 'string' ||
      typeof parsed.version !== 'string'
    ) {
      return undefined;
    }
    return parsed as PidfileRecord;
  } catch {
    return undefined;
  }
}

export async function writePidfile(path: string, record: PidfileRecord): Promise<void> {
  // Bun.write creates parent directories automatically and accepts a POSIX mode.
  // See: https://bun.sh/reference/bun/write
  await Bun.write(path, JSON.stringify(record, null, 2), { mode: 0o600 });
}

export async function removePidfile(path: string): Promise<void> {
  try {
    await Bun.file(path).delete();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/**
 * Acquires the pidfile for this process. If a stale entry exists (process not alive),
 * it is removed and overwritten. If a live process is detected, throws AlreadyRunningError.
 */
export async function acquirePidfile(
  path: string,
  details: Omit<PidfileRecord, 'pid' | 'startedAt'>,
): Promise<PidfileRecord> {
  const existing = await readPidfile(path);
  if (existing && isProcessAlive(existing.pid) && existing.pid !== process.pid) {
    throw new AlreadyRunningError(existing);
  }
  const record: PidfileRecord = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    host: details.host,
    port: details.port,
    version: details.version,
  };
  await writePidfile(path, record);
  return record;
}

/**
 * Sends SIGTERM to the recorded pid then waits up to `timeoutMs` for the pidfile to
 * disappear. Falls back to SIGKILL if it does not exit in time.
 */
export async function stopByPidfile(
  path: string,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {},
): Promise<{ stopped: boolean; killed: boolean; record?: PidfileRecord }> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const pollIntervalMs = options.pollIntervalMs ?? 100;
  const record = await readPidfile(path);
  if (!record) return { stopped: true, killed: false };
  if (!isProcessAlive(record.pid)) {
    await removePidfile(path);
    return { stopped: true, killed: false, record };
  }

  try {
    process.kill(record.pid, 'SIGTERM');
  } catch {
    // process exited between check and kill; treat as stopped
    await removePidfile(path);
    return { stopped: true, killed: false, record };
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessAlive(record.pid)) {
      await removePidfile(path);
      return { stopped: true, killed: false, record };
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  try {
    process.kill(record.pid, 'SIGKILL');
  } catch {
    // ignore
  }
  await removePidfile(path);
  return { stopped: !isProcessAlive(record.pid), killed: true, record };
}
