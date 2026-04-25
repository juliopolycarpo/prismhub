import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { createTempDirectory, type TempDirectoryHandle } from '@prismhub/testkit-base';
import {
  AlreadyRunningError,
  acquirePidfile,
  isProcessAlive,
  readPidfile,
  removePidfile,
  stopByPidfile,
  writePidfile,
  type PidfileRecord,
} from './pidfile.ts';

let tempDir: TempDirectoryHandle;
let pidfilePath: string;

const DETAILS = { host: '127.0.0.1', port: 3030, version: '0.1.0' };

beforeEach(() => {
  tempDir = createTempDirectory('prismhub-pidfile-test-');
  pidfilePath = join(tempDir.path, 'prismhub.pid');
});

afterEach(() => {
  tempDir.cleanup();
});

describe('isProcessAlive()', () => {
  test('returns true for current process', () => {
    expect(isProcessAlive(process.pid)).toBe(true);
  });

  test('returns false for invalid pids', () => {
    expect(isProcessAlive(0)).toBe(false);
    expect(isProcessAlive(-1)).toBe(false);
    expect(isProcessAlive(1.5)).toBe(false);
  });
});

describe('readPidfile()', () => {
  test('returns undefined when file does not exist', async () => {
    expect(await readPidfile(pidfilePath)).toBeUndefined();
  });

  test('returns undefined for malformed JSON', async () => {
    await Bun.write(pidfilePath, 'not-json');
    expect(await readPidfile(pidfilePath)).toBeUndefined();
  });

  test('returns undefined for JSON missing required fields', async () => {
    await Bun.write(pidfilePath, JSON.stringify({ pid: 123 }));
    expect(await readPidfile(pidfilePath)).toBeUndefined();
  });

  test('returns the record when valid', async () => {
    const record: PidfileRecord = {
      pid: process.pid,
      host: '127.0.0.1',
      port: 3030,
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    };
    await writePidfile(pidfilePath, record);
    expect(await readPidfile(pidfilePath)).toEqual(record);
  });
});

describe('removePidfile()', () => {
  test('does not throw when file does not exist', async () => {
    await removePidfile(pidfilePath);
  });

  test('removes the file', async () => {
    await writePidfile(pidfilePath, {
      pid: process.pid,
      host: '127.0.0.1',
      port: 3030,
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    });
    await removePidfile(pidfilePath);
    expect(await readPidfile(pidfilePath)).toBeUndefined();
  });
});

describe('acquirePidfile()', () => {
  test('creates pidfile with current pid when no existing file', async () => {
    const record = await acquirePidfile(pidfilePath, DETAILS);
    expect(record.pid).toBe(process.pid);
    expect(record.host).toBe('127.0.0.1');
    expect(record.port).toBe(3030);
    expect(await readPidfile(pidfilePath)).toEqual(record);
  });

  test('creates pidfile in non-existent parent directory', async () => {
    const deepPath = join(tempDir.path, 'nested', 'dir', 'prismhub.pid');
    const record = await acquirePidfile(deepPath, DETAILS);
    expect(record.pid).toBe(process.pid);
    expect(await readPidfile(deepPath)).toEqual(record);
  });

  test('overwrites stale pidfile when process has exited', async () => {
    const proc = Bun.spawn(['bun', '--version'], { stdout: 'ignore', stderr: 'ignore' });
    await proc.exited;
    const deadPid = proc.pid;

    await writePidfile(pidfilePath, {
      pid: deadPid,
      host: '127.0.0.1',
      port: 3031,
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    });

    const record = await acquirePidfile(pidfilePath, DETAILS);
    expect(record.pid).toBe(process.pid);
  });

  test('reacquires when recorded pid belongs to current process', async () => {
    await writePidfile(pidfilePath, {
      pid: process.pid,
      host: '127.0.0.1',
      port: 3031,
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    });
    const record = await acquirePidfile(pidfilePath, DETAILS);
    expect(record.pid).toBe(process.pid);
  });

  test('throws AlreadyRunningError when live process holds pidfile', async () => {
    const liveProc = Bun.spawn(['sleep', '60'], { stdout: 'ignore', stderr: 'ignore' });
    const livePid = liveProc.pid;

    try {
      await writePidfile(pidfilePath, {
        pid: livePid,
        host: '127.0.0.1',
        port: 3031,
        startedAt: new Date().toISOString(),
        version: '0.1.0',
      });

      const err = await acquirePidfile(pidfilePath, DETAILS).catch((e) => e);
      expect(err).toBeInstanceOf(AlreadyRunningError);
      expect((err as AlreadyRunningError).record.pid).toBe(livePid);
    } finally {
      liveProc.kill();
      await liveProc.exited;
    }
  });
});

describe('stopByPidfile()', () => {
  test('returns stopped=true when no pidfile exists', async () => {
    const result = await stopByPidfile(pidfilePath);
    expect(result).toEqual({ stopped: true, killed: false });
  });

  test('removes stale pidfile and returns stopped=true for dead process', async () => {
    const proc = Bun.spawn(['bun', '--version'], { stdout: 'ignore', stderr: 'ignore' });
    await proc.exited;
    const deadPid = proc.pid;

    const staleRecord: PidfileRecord = {
      pid: deadPid,
      host: '127.0.0.1',
      port: 3031,
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    };
    await writePidfile(pidfilePath, staleRecord);

    const result = await stopByPidfile(pidfilePath);
    expect(result.stopped).toBe(true);
    expect(result.killed).toBe(false);
    expect(result.record?.pid).toBe(deadPid);
    expect(await readPidfile(pidfilePath)).toBeUndefined();
  });

  test('stops live process via SIGTERM and removes pidfile', async () => {
    const proc = Bun.spawn(['sleep', '60'], { stdout: 'ignore', stderr: 'ignore' });
    const livePid = proc.pid;

    await writePidfile(pidfilePath, {
      pid: livePid,
      host: '127.0.0.1',
      port: 3030,
      startedAt: new Date().toISOString(),
      version: '0.1.0',
    });

    const result = await stopByPidfile(pidfilePath, { timeoutMs: 5000, pollIntervalMs: 50 });
    expect(result.stopped).toBe(true);
    expect(result.record?.pid).toBe(livePid);
    expect(await readPidfile(pidfilePath)).toBeUndefined();
  });
});
