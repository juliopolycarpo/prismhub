import type { PrismDatabase } from '../client.ts';
import { parseJsonUnknown } from '../json-utils.ts';

export interface InsertSessionEvent {
  readonly id: string;
  readonly sessionId: string;
  readonly kind: string;
  readonly payload: unknown;
  readonly at: string;
}

export interface SessionEventRow {
  readonly id: string;
  readonly sessionId: string;
  readonly kind: string;
  readonly payload: unknown;
  readonly at: string;
}

export async function insertSessionEvent(
  db: PrismDatabase,
  input: InsertSessionEvent,
): Promise<void> {
  await db
    .insertInto('session_events')
    .values({
      id: input.id,
      session_id: input.sessionId,
      kind: input.kind,
      payload_json: JSON.stringify(input.payload),
      at: input.at,
    })
    .execute();
}

export async function listSessionEvents(
  db: PrismDatabase,
  sessionId: string,
  limit = 500,
): Promise<readonly SessionEventRow[]> {
  const rows = await db
    .selectFrom('session_events')
    .selectAll()
    .where('session_id', '=', sessionId)
    .orderBy('at', 'asc')
    .limit(limit)
    .execute();
  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    kind: row.kind,
    payload: parseJsonUnknown(row.payload_json),
    at: row.at,
  }));
}
