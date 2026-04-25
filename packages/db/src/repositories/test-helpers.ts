import { createTempDatabaseHandle } from '@prismhub/testkit-base';
import { closeDatabase, createDatabase, runMigrations, type PrismDatabase } from '../index.ts';

export interface TestDatabase {
  readonly db: PrismDatabase;
  readonly cleanup: () => Promise<void>;
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const handle = createTempDatabaseHandle();
  const db = createDatabase({ filename: handle.databasePath });
  await runMigrations(db);

  return {
    db,
    cleanup: async () => {
      await closeDatabase(db);
      handle.cleanup();
    },
  };
}
