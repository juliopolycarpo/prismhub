import type { StatusService } from '@prismhub/core';
import { jsonResult } from '../registry.ts';
import type { ToolDefinition } from '../tool.types.ts';

export interface StatusToolDeps {
  readonly statusService: StatusService;
}

export function createStatusTool(deps: StatusToolDeps): ToolDefinition {
  return {
    name: 'status',
    description:
      'Returns a snapshot of Prismhub runtime status (version, uptime, db readiness, upstream count).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: async () => {
      const snapshot = await deps.statusService.snapshot();
      return jsonResult(snapshot);
    },
  };
}
