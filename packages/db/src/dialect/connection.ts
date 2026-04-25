import type { Database, Statement } from 'bun:sqlite';
import type { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import { SelectQueryNode } from 'kysely';

type SqliteRow = Record<string, unknown>;

// Matches a top-level RETURNING clause on INSERT/UPDATE/DELETE.
// SQLite supports this and Kysely uses it to read back rows after writes.
const RETURNING_RE = /\breturning\b/i;

export class BunSqliteConnection implements DatabaseConnection {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery;
    const stmt = this.#db.prepare(sql) as Statement<SqliteRow>;
    const args = parameters as unknown[];

    if (SelectQueryNode.is(query)) {
      const rows = stmt.all(...(args as [])) as R[];
      return { rows };
    }

    if (RETURNING_RE.test(sql)) {
      const rows = stmt.all(...(args as [])) as R[];
      return {
        rows,
        numAffectedRows: BigInt(rows.length),
      };
    }

    const result = stmt.run(...(args as []));
    return {
      rows: [] as R[],
      numAffectedRows: BigInt(result.changes),
      insertId: BigInt(result.lastInsertRowid),
    };
  }

  async *streamQuery<R>(compiledQuery: CompiledQuery): AsyncIterableIterator<QueryResult<R>> {
    const result = await this.executeQuery<R>(compiledQuery);
    yield result;
  }
}
