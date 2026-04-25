import { join } from 'node:path';
import { createTempDirectory } from './fs.ts';

export interface TempDatabaseHandle {
  readonly databasePath: string;
  readonly dataDir: string;
  readonly cleanup: () => void;
}

export function createTempDatabaseHandle(): TempDatabaseHandle {
  const tempDir = createTempDirectory('prismhub-db-');
  return {
    dataDir: tempDir.path,
    databasePath: join(tempDir.path, 'database.sqlite'),
    cleanup: tempDir.cleanup,
  };
}
