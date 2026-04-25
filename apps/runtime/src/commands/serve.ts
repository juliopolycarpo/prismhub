import { createAppApi } from '@prismhub/app-api';
import { createAuthPlugin } from '@prismhub/auth';
import { APP_VERSION } from '@prismhub/config';
import { acquirePidfile, AlreadyRunningError, removePidfile } from '../daemon/index.ts';
import { createPrismServer, listen } from '@prismhub/http-server';
import { createStreamableHttpPlugin } from '@prismhub/mcp-host';
import { ASSETS, hasAssets } from '@prismhub/web-assets';
import { composeServices } from '../compose.ts';
import { buildMcpServerFactory } from '../mcp-runtime.ts';

export async function serveCommand(): Promise<number> {
  const services = await composeServices({ version: APP_VERSION, serviceName: 'serve' });
  services.logger.info('starting server', {
    host: services.config.http.host,
    port: services.config.http.port,
  });

  const appApi = createAppApi(services);
  const authPlugin = createAuthPlugin({ auth: services.auth });
  const mcpPlugin = createStreamableHttpPlugin({
    serverFactory: buildMcpServerFactory(services, APP_VERSION),
  });

  const server = createPrismServer({
    appApi,
    statusService: services.statusService,
    authPlugin,
    mcpPlugin,
    ...(hasAssets() ? { webAssets: ASSETS } : {}),
  });

  const listening = await listen(server, {
    host: services.config.http.host,
    port: services.config.http.port,
  });

  try {
    await acquirePidfile(services.config.paths.pidfilePath, {
      host: listening.host,
      port: listening.port,
      version: APP_VERSION,
    });
  } catch (err) {
    if (err instanceof AlreadyRunningError) {
      services.logger.error('another prismhub instance is already running', {
        pid: err.record.pid,
        host: err.record.host,
        port: err.record.port,
      });
      await listening.stop();
      await services.shutdown();
      return 3;
    }
    throw err;
  }

  services.logger.info('server listening', {
    host: listening.host,
    port: listening.port,
    pid: process.pid,
  });

  return await new Promise<number>((resolve) => {
    let shuttingDown = false;
    const shutdown = async (signal: NodeJS.Signals) => {
      if (shuttingDown) return;
      shuttingDown = true;
      services.logger.info('shutdown', { signal });
      try {
        await listening.stop();
      } finally {
        try {
          await services.shutdown();
        } finally {
          await removePidfile(services.config.paths.pidfilePath);
        }
      }
      resolve(0);
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  });
}
