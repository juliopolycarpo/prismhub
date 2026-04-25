import { Type, type Static } from '@sinclair/typebox';

export const HookSourceSchema = Type.Union([
  Type.Literal('claude-code'),
  Type.Literal('codex'),
  Type.Literal('vscode'),
  Type.Literal('other'),
]);
export type HookSource = Static<typeof HookSourceSchema>;

export const UlidSchema = Type.String({
  pattern: '^[0-9A-HJKMNP-TV-Z]{26}$',
  description: 'Client-generated ULID (Crockford base32, 26 chars).',
});

export const IsoDateTimeSchema = Type.String({
  format: 'date-time',
  description: 'ISO 8601 UTC timestamp.',
});

export const MetadataSchema = Type.Optional(Type.Record(Type.String(), Type.Unknown()));
