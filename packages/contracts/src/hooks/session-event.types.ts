import { Type, type Static } from '@sinclair/typebox';
import { IsoDateTimeSchema, UlidSchema } from './shared.types.ts';

const MessageEventSchema = Type.Object({
  sessionId: UlidSchema,
  kind: Type.Literal('message'),
  role: Type.Union([Type.Literal('user'), Type.Literal('assistant'), Type.Literal('system')]),
  content: Type.String({ minLength: 1, maxLength: 100_000 }),
  at: IsoDateTimeSchema,
});

const ToolCallEventSchema = Type.Object({
  sessionId: UlidSchema,
  kind: Type.Literal('tool_call'),
  invocationId: UlidSchema,
  toolName: Type.String({ minLength: 1, maxLength: 200 }),
  input: Type.Unknown(),
  at: IsoDateTimeSchema,
});

const ToolResultEventSchema = Type.Object({
  sessionId: UlidSchema,
  kind: Type.Literal('tool_result'),
  invocationId: UlidSchema,
  status: Type.Union([Type.Literal('ok'), Type.Literal('error')]),
  output: Type.Optional(Type.Unknown()),
  error: Type.Optional(Type.String({ maxLength: 5000 })),
  at: IsoDateTimeSchema,
});

const SystemEventSchema = Type.Object({
  sessionId: UlidSchema,
  kind: Type.Literal('system'),
  message: Type.String({ minLength: 1, maxLength: 5000 }),
  at: IsoDateTimeSchema,
});

export const SessionEventPayloadSchema = Type.Union([
  MessageEventSchema,
  ToolCallEventSchema,
  ToolResultEventSchema,
  SystemEventSchema,
]);

export type SessionEventPayload = Static<typeof SessionEventPayloadSchema>;
export type SessionEventKind = SessionEventPayload['kind'];
