import { Type, type Static } from '@sinclair/typebox';
import { HookSourceSchema, IsoDateTimeSchema, UlidSchema } from '../hooks/shared.types.ts';

export const SessionStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('completed'),
  Type.Literal('aborted'),
  Type.Literal('timeout'),
]);
export type SessionStatus = Static<typeof SessionStatusSchema>;

export const SessionRecordSchema = Type.Object({
  id: UlidSchema,
  source: HookSourceSchema,
  agent: Type.String(),
  title: Type.Union([Type.String(), Type.Null()]),
  workingDir: Type.Union([Type.String(), Type.Null()]),
  status: SessionStatusSchema,
  startedAt: IsoDateTimeSchema,
  endedAt: Type.Union([IsoDateTimeSchema, Type.Null()]),
  messageCount: Type.Integer({ minimum: 0 }),
  toolCallCount: Type.Integer({ minimum: 0 }),
});

export type SessionRecord = Static<typeof SessionRecordSchema>;
