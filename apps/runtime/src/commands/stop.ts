import { loadConfig } from '@prismhub/config';
import { stopByPidfile } from '../daemon/index.ts';

export async function stopCommand(): Promise<number> {
  const config = loadConfig();
  const result = await stopByPidfile(config.paths.pidfilePath);
  if (!result.record) {
    process.stdout.write('prismhub is not running (no pidfile)\n');
    return 0;
  }
  if (result.killed) {
    process.stdout.write(
      `prismhub did not exit gracefully; sent SIGKILL to pid ${result.record.pid}\n`,
    );
    return result.stopped ? 0 : 1;
  }
  process.stdout.write(`prismhub stopped (pid ${result.record.pid})\n`);
  return 0;
}
