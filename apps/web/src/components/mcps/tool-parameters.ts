import type { McpToolInput, McpToolParameter } from '@prismhub/contracts';

export type ParameterControl =
  | 'boolean'
  | 'number'
  | 'integer'
  | 'string'
  | 'array'
  | 'enum'
  | 'unknown';

export interface ParsedParameter {
  readonly name: string;
  readonly control: ParameterControl;
  readonly required: boolean;
  readonly description: string | null;
  readonly defaultValue: unknown;
  readonly enumOptions: readonly string[] | null;
  readonly minimum: number | null;
  readonly maximum: number | null;
}

/**
 * Convert a tool's JSON-Schema-ish inputSchema into a flat list of UI-renderable
 * parameter descriptors. Returns an empty list when the schema is missing or has
 * no top-level `properties`.
 */
export function parseToolParameters(input: McpToolInput | null): readonly ParsedParameter[] {
  if (!input?.properties) return [];
  const required = new Set(input.required ?? []);
  return Object.entries(input.properties).map(([name, raw]) =>
    toParsedParameter(name, raw, required.has(name)),
  );
}

function toParsedParameter(
  name: string,
  raw: McpToolParameter,
  required: boolean,
): ParsedParameter {
  const enumOptions = toEnumOptions(raw.enum);
  return {
    name,
    control: pickControl(raw, enumOptions),
    required,
    description: raw.description ?? null,
    defaultValue: raw.default,
    enumOptions,
    minimum: typeof raw.minimum === 'number' ? raw.minimum : null,
    maximum: typeof raw.maximum === 'number' ? raw.maximum : null,
  };
}

function pickControl(
  raw: McpToolParameter,
  enumOptions: readonly string[] | null,
): ParameterControl {
  if (enumOptions) return 'enum';
  if (raw.type === 'boolean') return 'boolean';
  if (raw.type === 'integer') return 'integer';
  if (raw.type === 'number') return 'number';
  if (raw.type === 'string') return 'string';
  if (raw.type === 'array') return 'array';
  return 'unknown';
}

function toEnumOptions(values: readonly unknown[] | undefined): readonly string[] | null {
  if (!values || values.length === 0) return null;
  const strings = values.filter((v): v is string => typeof v === 'string');
  return strings.length === values.length ? strings : null;
}
