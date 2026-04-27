import { Type, type Static } from '@sinclair/typebox';
import { IsoDateTimeSchema, UlidSchema } from '../hooks/shared.types.ts';

export const McpTransportKindSchema = Type.Union([Type.Literal('stdio'), Type.Literal('http')]);
export type McpTransportKind = Static<typeof McpTransportKindSchema>;
const NullableStringSchema = Type.Union([Type.String(), Type.Null()]);
const McpServerNameFieldSchema = Type.String({ minLength: 1, maxLength: 120 });
const McpServerDescriptionFieldSchema = Type.String({ maxLength: 1000 });

/** HTTP request headers attached to every upstream call (e.g. Authorization). */
export const McpHttpHeadersSchema = Type.Record(Type.String({ minLength: 1 }), Type.String(), {
  maxProperties: 32,
});
export type McpHttpHeaders = Static<typeof McpHttpHeadersSchema>;

export const McpServerRecordSchema = Type.Object({
  id: UlidSchema,
  name: McpServerNameFieldSchema,
  description: NullableStringSchema,
  transport: McpTransportKindSchema,
  command: NullableStringSchema,
  args: Type.Union([Type.Array(Type.String()), Type.Null()]),
  url: Type.Union([Type.String(), Type.Null()]),
  headers: Type.Union([McpHttpHeadersSchema, Type.Null()]),
  enabled: Type.Boolean(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type McpServerRecord = Static<typeof McpServerRecordSchema>;

export const RegisterMcpServerInputSchema = Type.Object({
  name: McpServerNameFieldSchema,
  description: Type.Optional(McpServerDescriptionFieldSchema),
  transport: McpTransportKindSchema,
  command: Type.Optional(Type.String({ maxLength: 500 })),
  args: Type.Optional(Type.Array(Type.String({ maxLength: 500 }))),
  url: Type.Optional(Type.String({ format: 'uri', maxLength: 2000 })),
  headers: Type.Optional(McpHttpHeadersSchema),
  enabled: Type.Optional(Type.Boolean()),
});
export type RegisterMcpServerInput = Static<typeof RegisterMcpServerInputSchema>;

/**
 * Permissive JSON-Schema-ish description of a single tool parameter.
 * We only narrow the well-known fields the UI uses to render controls;
 * everything else is allowed to pass through.
 */
export const McpToolParameterSchema = Type.Object(
  {
    type: Type.Optional(
      Type.Union([
        Type.Literal('string'),
        Type.Literal('number'),
        Type.Literal('integer'),
        Type.Literal('boolean'),
        Type.Literal('array'),
        Type.Literal('object'),
        Type.Literal('null'),
      ]),
    ),
    description: Type.Optional(Type.String()),
    default: Type.Optional(Type.Unknown()),
    enum: Type.Optional(Type.Array(Type.Unknown())),
    minimum: Type.Optional(Type.Number()),
    maximum: Type.Optional(Type.Number()),
  },
  { additionalProperties: true },
);
export type McpToolParameter = Static<typeof McpToolParameterSchema>;

/** Top-level inputSchema shape returned by an MCP tool. */
export const McpToolInputSchema = Type.Object(
  {
    type: Type.Optional(Type.Literal('object')),
    properties: Type.Optional(Type.Record(Type.String(), McpToolParameterSchema)),
    required: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: true },
);
export type McpToolInput = Static<typeof McpToolInputSchema>;

/** Tool exposed by an upstream MCP server, surfaced to the UI. */
export const McpToolSummarySchema = Type.Object({
  name: Type.String(),
  description: NullableStringSchema,
  inputSchema: Type.Union([McpToolInputSchema, Type.Null()]),
});
export type McpToolSummary = Static<typeof McpToolSummarySchema>;

export const McpServerToolsResponseSchema = Type.Object({
  serverId: UlidSchema,
  tools: Type.Array(McpToolSummarySchema),
  error: Type.Optional(Type.String()),
});
export type McpServerToolsResponse = Static<typeof McpServerToolsResponseSchema>;

export const UpdateMcpServerInputSchema = Type.Object({
  enabled: Type.Optional(Type.Boolean()),
  description: Type.Optional(McpServerDescriptionFieldSchema),
});
export type UpdateMcpServerInput = Static<typeof UpdateMcpServerInputSchema>;
