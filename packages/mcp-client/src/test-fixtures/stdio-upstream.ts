import { createToolRegistry } from '@prismhub/mcp-core';
import { createPrismMcpServer, connectStdio } from '@prismhub/mcp-host';
import { ECHO_UPSTREAM_TOOL } from './echo-upstream-tool.ts';

const registry = createToolRegistry([ECHO_UPSTREAM_TOOL]);
const server = createPrismMcpServer({
  name: 'stdio-upstream',
  version: '0.0.0',
  registry,
});

await connectStdio(server);
