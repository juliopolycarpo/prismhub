import { loadConfig } from '@prismhub/config';
import { isProcessAlive, readPidfile, removePidfile } from '../daemon/index.ts';

export async function statusCommand(): Promise<number> {
  const config = loadConfig();
  const record = await readPidfile(config.paths.pidfilePath);
  if (!record) {
    process.stdout.write(JSON.stringify({ running: false }) + '\n');
    return 0;
  }
  if (!isProcessAlive(record.pid)) {
    await removePidfile(config.paths.pidfilePath);
    process.stdout.write(
      JSON.stringify({ running: false, stale: true, lastPid: record.pid }) + '\n',
    );
    return 0;
  }
  const startedAtMs = Date.parse(record.startedAt);
  const uptimeSec = Number.isFinite(startedAtMs)
    ? Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))
    : 0;
  process.stdout.write(
    JSON.stringify({
      running: true,
      pid: record.pid,
      host: record.host,
      port: record.port,
      version: record.version,
      startedAt: record.startedAt,
      uptimeSec,
    }) + '\n',
  );
  return 0;
}
