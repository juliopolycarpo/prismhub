import type { PrismDatabase } from '../client.ts';
import type { SessionsTable } from '../schema.types.ts';
import { parseJsonObject } from '../json-utils.ts';
import { sql } from 'kysely';

export interface SessionRow {
  readonly id: string;
  readonly source: string;
  readonly agent: string;
  readonly title: string | null;
  readonly workingDir: string | null;
  readonly status: string;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly messageCount: number;
  readonly toolCallCount: number;
  readonly metadata: Record<string, unknown> | null;
}

function rowToDomain(row: SessionsTable): SessionRow {
  return {
    id: row.id,
    source: row.source,
    agent: row.agent,
    title: row.title,
    workingDir: row.working_dir,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    messageCount: row.message_count,
    toolCallCount: row.tool_call_count,
    metadata: parseJsonObject(row.metadata_json),
  };
}

export interface InsertSession {
  readonly id: string;
  readonly source: string;
  readonly agent: string;
  readonly title: string | null;
  readonly workingDir: string | null;
  readonly startedAt: string;
  readonly metadata: Record<string, unknown> | null;
}

export async function insertSession(db: PrismDatabase, input: InsertSession): Promise<SessionRow> {
  await db
    .insertInto('sessions')
    .values({
      id: input.id,
      source: input.source,
      agent: input.agent,
      title: input.title,
      working_dir: input.workingDir,
      status: 'active',
      started_at: input.startedAt,
      ended_at: null,
      message_count: 0,
      tool_call_count: 0,
      metadata_json: input.metadata ? JSON.stringify(input.metadata) : null,
    })
    .onConflict((oc) => oc.column('id').doNothing())
    .execute();
  return getSessionByIdOrThrow(db, input.id);
}

export async function listSessions(
  db: PrismDatabase,
  limit = 100,
  offset = 0,
): Promise<readonly SessionRow[]> {
  const rows = await db
    .selectFrom('sessions')
    .selectAll()
    .orderBy('started_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();
  return rows.map(rowToDomain);
}

export async function getSessionByIdOrThrow(db: PrismDatabase, id: string): Promise<SessionRow> {
  const row = await db
    .selectFrom('sessions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  return rowToDomain(row);
}

export async function incrementSessionCounter(
  db: PrismDatabase,
  id: string,
  column: 'message_count' | 'tool_call_count',
): Promise<void> {
  // Single-statement atomic increment — avoids a SELECT + UPDATE race condition.
  await db
    .updateTable('sessions')
    .set({ [column]: sql<number>`${sql.ref(column)} + 1` })
    .where('id', '=', id)
    .execute();
}

export interface CloseSessionInput {
  readonly id: string;
  readonly endedAt: string;
  readonly status: 'completed' | 'aborted' | 'timeout';
}

export async function closeSession(db: PrismDatabase, input: CloseSessionInput): Promise<void> {
  await db
    .updateTable('sessions')
    .set({ ended_at: input.endedAt, status: input.status })
    .where('id', '=', input.id)
    .execute();
}
