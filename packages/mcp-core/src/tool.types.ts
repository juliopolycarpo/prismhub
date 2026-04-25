export interface ToolTextContent {
  readonly type: 'text';
  readonly text: string;
}

export interface ToolResult {
  readonly content: readonly ToolTextContent[];
  readonly isError?: boolean;
}

export interface JsonSchemaObject {
  readonly type: 'object';
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonSchemaObject;
  readonly handler: (args: Readonly<Record<string, unknown>>) => Promise<ToolResult>;
}

export interface ToolRegistry {
  readonly list: () => readonly ToolDefinition[];
  readonly find: (name: string) => ToolDefinition | undefined;
}
