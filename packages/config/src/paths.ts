import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import type { PathsConfig } from './config.types.ts';

const DEFAULT_DATA_DIR_NAME = '.prismhub';
const DATABASE_SUBDIR = 'database';
const DATABASE_FILENAME = 'database.sqlite';
const PIDFILE_NAME = 'prismhub.pid';
const LOGS_SUBDIR = 'logs';

export function expandTilde(maybeTildePath: string): string {
  if (maybeTildePath.startsWith('~/')) {
    return join(homedir(), maybeTildePath.slice(2));
  }
  if (maybeTildePath === '~') {
    return homedir();
  }
  return maybeTildePath;
}

export function resolveDataDir(override: string | undefined): string {
  if (override && override.length > 0) {
    return resolve(expandTilde(override));
  }
  return join(homedir(), DEFAULT_DATA_DIR_NAME);
}

export function buildPathsConfig(dataDirOverride: string | undefined): PathsConfig {
  const dataDir = resolveDataDir(dataDirOverride);
  return {
    home: homedir(),
    dataDir,
    databasePath: join(dataDir, DATABASE_SUBDIR, DATABASE_FILENAME),
    pidfilePath: join(dataDir, PIDFILE_NAME),
    logsDir: join(dataDir, LOGS_SUBDIR),
  };
}
