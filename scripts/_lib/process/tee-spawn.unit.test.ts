import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { teeSpawn } from './tee-spawn';

const CHILD_SCRIPT =
  "console.log(`stdout:${Bun.env.PRISMHUB_TEE_VALUE}`); console.error('stderr:boom'); process.exit(3);";

function createTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'prismhub-tee-spawn-'));
}

describe('teeSpawn()', () => {
  test('writes child output to the log file and preserves the exit code', async () => {
    const rootDir = createTempRoot();
    try {
      const logPath = join(rootDir, 'results', 'tee.log.txt');
      const result = await teeSpawn([process.execPath, '-e', CHILD_SCRIPT], logPath, {
        PRISMHUB_TEE_VALUE: 'ok',
      });

      const logText = await Bun.file(logPath).text();

      expect(result.exitCode).toBe(3);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(logText).toContain('stdout:ok');
      expect(logText).toContain('stderr:boom');
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
