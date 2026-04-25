import { APP_VERSION } from '@prismhub/config';
import { connectStdio } from '@prismhub/mcp-host';
import { composeServices } from '../compose.ts';
import { buildMcpServer } from '../mcp-runtime.ts';

export async function mcpCommand(): Promise<number> {
  process.env.PRISMHUB_STDIO = '1';

  const services = await composeServices({ version: APP_VERSION, serviceName: 'mcp' });

  const mcpServer = buildMcpServer(services, APP_VERSION);
  await connectStdio(mcpServer);

  return await new Promise<number>((resolve) => {
    const shutdown = async () => {
      try {
        await services.shutdown();
      } finally {
        resolve(0);
      }
    };
    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());
  });
}
