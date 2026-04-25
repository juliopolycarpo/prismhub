import { Kysely } from 'kysely';
import { BunSqliteDialect } from './dialect/dialect.ts';
import type { BunSqliteDialectOptions } from './dialect/dialect.types.ts';
import type { DatabaseSchema } from './schema.types.ts';

export type PrismDatabase = Kysely<DatabaseSchema>;

export function createDatabase(options: BunSqliteDialectOptions): PrismDatabase {
  return new Kysely<DatabaseSchema>({
    dialect: new BunSqliteDialect(options),
  });
}

export async function closeDatabase(db: PrismDatabase): Promise<void> {
  await db.destroy();
}
