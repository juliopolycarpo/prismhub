import type { LogFields } from './log.types.ts';

export interface AuditEvent {
  readonly action: string;
  readonly actor: string;
  readonly target: string;
  readonly at: string;
  readonly details: LogFields | undefined;
}
