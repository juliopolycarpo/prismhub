import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  createListUpstreamServersTool,
  createStatusTool,
  createToolRegistry,
} from '@prismhub/mcp-core';
import { createPrismMcpServer } from '@prismhub/mcp-host';
import type { PrismServices } from './compose.ts';

/**
 * Returns a factory that creates a fresh MCP Server per call.
 * Use this for HTTP transports — each Streamable HTTP session needs its own
 * Server instance to avoid state leaking across clients.
 *
 * The ToolRegistry is shared across sessions (stateless, read-only).
 */
export function buildMcpServerFactory(services: PrismServices, version: string): () => Server {
  const registry = createToolRegistry([
    createStatusTool(services),
    createListUpstreamServersTool(services),
  ]);
  return () => createPrismMcpServer({ name: 'prismhub', version, registry });
}

/**
 * Builds a single MCP Server instance.
 * Use this for stdio transport where there is exactly one client per process.
 */
export function buildMcpServer(services: PrismServices, version: string): Server {
  return buildMcpServerFactory(services, version)();
}
