import { loadConfig } from '@prismhub/config';
import { closeDatabase, createDatabase, runMigrations } from '@prismhub/db';
import { createLogger } from '@prismhub/observability';

export async function migrateCommand(): Promise<number> {
  const config = loadConfig();
  const logger = createLogger({
    level: config.logging.level,
    stdioSafe: config.logging.stdioSafe,
    serviceName: 'migrate',
  });

  logger.info('running migrations', { databasePath: config.paths.databasePath });

  const db = createDatabase({ filename: config.paths.databasePath });
  try {
    const result = await runMigrations(db);
    logger.info('migrations complete', {
      applied: result.applied,
      alreadyApplied: result.alreadyApplied,
    });
    return 0;
  } catch (error) {
    logger.error('migrations failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 1;
  } finally {
    await closeDatabase(db);
  }
}
