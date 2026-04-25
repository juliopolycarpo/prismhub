import { Type, type Static } from '@sinclair/typebox';
import { HookSourceSchema, IsoDateTimeSchema, MetadataSchema, UlidSchema } from './shared.types.ts';

export const SessionStartPayloadSchema = Type.Object({
  sessionId: UlidSchema,
  source: HookSourceSchema,
  agent: Type.String({ minLength: 1, maxLength: 120 }),
  title: Type.Optional(Type.String({ maxLength: 200 })),
  workingDir: Type.Optional(Type.String({ maxLength: 500 })),
  startedAt: IsoDateTimeSchema,
  metadata: MetadataSchema,
});

export type SessionStartPayload = Static<typeof SessionStartPayloadSchema>;
