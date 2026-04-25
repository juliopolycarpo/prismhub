import type { RuntimeConfig } from './config.types.ts';
import {
  ConfigError,
  parseAuthBaseUrl,
  parseAuthSecret,
  parseBoolean,
  parseEnvironment,
  parseHost,
  parseLogLevel,
  parsePort,
  parseTrustedOrigins,
} from './env.ts';
import { buildPathsConfig } from './paths.ts';

export interface EnvSource {
  readonly get: (name: string) => string | undefined;
}

export const processEnvSource: EnvSource = {
  get: (name) => process.env[name],
};

const NON_LOCAL_HOSTS = new Set(['0.0.0.0', '::', '::0']);

export function loadConfig(env: EnvSource = processEnvSource): RuntimeConfig {
  const environment = parseEnvironment(env.get('NODE_ENV'));
  const host = parseHost(env.get('PRISMHUB_HOST'));
  const port = parsePort(env.get('PRISMHUB_PORT'));
  const trustNonLocal = parseBoolean(env.get('PRISMHUB_TRUST_NON_LOCAL'), false);

  if (NON_LOCAL_HOSTS.has(host) && !trustNonLocal) {
    throw new ConfigError(
      `Refusing to bind to non-local host "${host}" — set PRISMHUB_TRUST_NON_LOCAL=1 to allow.`,
    );
  }

  const stdioSafe = parseBoolean(env.get('PRISMHUB_STDIO'), false);
  const logLevel = parseLogLevel(env.get('PRISMHUB_LOG_LEVEL'));
  const paths = buildPathsConfig(env.get('PRISMHUB_DATA_DIR'));
  const authSecret = parseAuthSecret(env.get('BETTER_AUTH_SECRET'), environment);
  const authBaseUrl = parseAuthBaseUrl(env.get('BETTER_AUTH_URL'), { host, port });
  const trustedOrigins = parseTrustedOrigins(
    env.get('BETTER_AUTH_TRUSTED_ORIGINS'),
    environment,
    authBaseUrl,
  );

  return {
    env: environment,
    http: { host, port, trustNonLocal },
    paths,
    logging: { level: logLevel, stdioSafe },
    auth: { secret: authSecret, baseUrl: authBaseUrl, trustedOrigins },
  };
}
