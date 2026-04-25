import type { PrismDatabase } from '../client.ts';

export interface InsertAuditEvent {
  readonly id: string;
  readonly at: string;
  readonly action: string;
  readonly actor: string;
  readonly target: string;
  readonly details?: Record<string, unknown>;
}

export async function insertAuditEvent(db: PrismDatabase, input: InsertAuditEvent): Promise<void> {
  await db
    .insertInto('audit_events')
    .values({
      id: input.id,
      at: input.at,
      action: input.action,
      actor: input.actor,
      target: input.target,
      details_json: input.details ? JSON.stringify(input.details) : null,
    })
    .execute();
}
