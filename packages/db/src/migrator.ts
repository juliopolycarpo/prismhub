import { sql } from 'kysely';
import type { PrismDatabase } from './client.ts';
import { MIGRATIONS, type Migration } from './migrations/index.ts';

export interface MigrationResult {
  readonly applied: readonly string[];
  readonly alreadyApplied: readonly string[];
}

async function ensureMigrationsTable(db: PrismDatabase): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `.execute(db);
}

async function loadAppliedMigrationNames(db: PrismDatabase): Promise<Set<string>> {
  const rows = await db.selectFrom('migrations').select('name').execute();
  return new Set(rows.map((row) => row.name));
}

async function applyMigration(db: PrismDatabase, migration: Migration): Promise<void> {
  await db.transaction().execute(async (tx) => {
    await migration.up(tx);
    await tx
      .insertInto('migrations')
      .values({ name: migration.name, applied_at: new Date().toISOString() })
      .execute();
  });
}

async function revertMigration(db: PrismDatabase, migration: Migration): Promise<void> {
  await db.transaction().execute(async (tx) => {
    await migration.down(tx);
    await tx.deleteFrom('migrations').where('name', '=', migration.name).execute();
  });
}

export async function runMigrations(
  db: PrismDatabase,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<MigrationResult> {
  await ensureMigrationsTable(db);
  const alreadyApplied = await loadAppliedMigrationNames(db);
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    if (alreadyApplied.has(migration.name)) {
      skipped.push(migration.name);
      continue;
    }
    await applyMigration(db, migration);
    applied.push(migration.name);
  }

  return { applied, alreadyApplied: skipped };
}

export async function revertMigrations(
  db: PrismDatabase,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<MigrationResult> {
  await ensureMigrationsTable(db);
  const applied = await loadAppliedMigrationNames(db);
  const reverted: string[] = [];
  const skipped: string[] = [];

  for (const migration of [...migrations].reverse()) {
    if (!applied.has(migration.name)) {
      skipped.push(migration.name);
      continue;
    }
    await revertMigration(db, migration);
    reverted.push(migration.name);
  }

  return { applied: reverted, alreadyApplied: skipped };
}
