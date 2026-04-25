import { Database } from 'bun:sqlite';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import type { DatabaseConnection, Driver } from 'kysely';
import { CompiledQuery } from 'kysely';
import type { BunSqliteDialectOptions } from './dialect.types.ts';
import { BunSqliteConnection } from './connection.ts';

const BEGIN = CompiledQuery.raw('begin');
const COMMIT = CompiledQuery.raw('commit');
const ROLLBACK = CompiledQuery.raw('rollback');

export class DriverNotInitializedError extends Error {
  constructor() {
    super('BunSqliteDriver.init() was not called before acquireConnection.');
    this.name = 'DriverNotInitializedError';
  }
}

export class BunSqliteDriver implements Driver {
  readonly #options: BunSqliteDialectOptions;
  #db: Database | null = null;
  #connection: BunSqliteConnection | null = null;

  constructor(options: BunSqliteDialectOptions) {
    this.#options = options;
  }

  async init(): Promise<void> {
    const { filename, readonly = false, create = true } = this.#options;
    if (create && filename !== ':memory:') {
      mkdirSync(dirname(filename), { recursive: true });
    }
    this.#db = new Database(filename, {
      readonly,
      create,
      strict: false,
      safeIntegers: false,
    });
    this.#db.exec('PRAGMA journal_mode = WAL;');
    this.#db.exec('PRAGMA foreign_keys = ON;');
    this.#db.exec('PRAGMA busy_timeout = 5000;');
    this.#connection = new BunSqliteConnection(this.#db);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.#connection) {
      throw new DriverNotInitializedError();
    }
    return this.#connection;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(BEGIN);
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(COMMIT);
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(ROLLBACK);
  }

  async releaseConnection(_connection: DatabaseConnection): Promise<void> {}

  async destroy(): Promise<void> {
    this.#db?.close();
    this.#db = null;
    this.#connection = null;
  }
}
