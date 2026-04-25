import type {
  McpServerRecord,
  McpServerToolsResponse,
  RegisterMcpServerInput,
  UpdateMcpServerInput,
} from '@prismhub/contracts';

export interface McpRegistryService {
  readonly list: () => Promise<readonly McpServerRecord[]>;
  readonly register: (input: RegisterMcpServerInput) => Promise<McpServerRecord>;
  readonly update: (id: string, input: UpdateMcpServerInput) => Promise<McpServerRecord>;
  /**
   * Connects to the upstream and returns the tools it currently advertises.
   * Returns `tools: []` plus a non-fatal `error` string when the upstream is
   * unreachable so the UI can render a clear status without breaking the page.
   */
  readonly listTools: (id: string) => Promise<McpServerToolsResponse>;
}
