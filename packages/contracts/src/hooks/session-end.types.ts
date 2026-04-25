import { Type, type Static } from '@sinclair/typebox';
import { IsoDateTimeSchema, UlidSchema } from './shared.types.ts';

export const SessionEndPayloadSchema = Type.Object({
  sessionId: UlidSchema,
  endedAt: IsoDateTimeSchema,
  reason: Type.Optional(
    Type.Union([Type.Literal('completed'), Type.Literal('aborted'), Type.Literal('timeout')]),
  ),
  stats: Type.Optional(
    Type.Object({
      messages: Type.Optional(Type.Integer({ minimum: 0 })),
      toolCalls: Type.Optional(Type.Integer({ minimum: 0 })),
    }),
  ),
});

export type SessionEndPayload = Static<typeof SessionEndPayloadSchema>;
