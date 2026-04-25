import { Type, type Static } from '@sinclair/typebox';
import { IsoDateTimeSchema, UlidSchema } from '../hooks/shared.types.ts';
import { SessionEventPayloadSchema } from '../hooks/session-event.types.ts';
import { SessionStartPayloadSchema } from '../hooks/session-start.types.ts';
import { SessionEndPayloadSchema } from '../hooks/session-end.types.ts';

export const FeedEventSchema = Type.Union([
  Type.Object({
    kind: Type.Literal('session_started'),
    at: IsoDateTimeSchema,
    session: SessionStartPayloadSchema,
  }),
  Type.Object({
    kind: Type.Literal('session_event'),
    at: IsoDateTimeSchema,
    event: SessionEventPayloadSchema,
  }),
  Type.Object({
    kind: Type.Literal('session_ended'),
    at: IsoDateTimeSchema,
    summary: SessionEndPayloadSchema,
  }),
]);
export type FeedEvent = Static<typeof FeedEventSchema>;

export const FeedEnvelopeSchema = Type.Object({
  id: UlidSchema,
  event: FeedEventSchema,
});
export type FeedEnvelope = Static<typeof FeedEnvelopeSchema>;
