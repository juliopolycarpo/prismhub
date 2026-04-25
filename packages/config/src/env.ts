import type { LogLevel } from './config.types.ts';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3030;

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

export function parseHost(raw: string | undefined): string {
  if (!raw || raw.length === 0) return DEFAULT_HOST;
  return raw;
}

export function parsePort(raw: string | undefined): number {
  if (!raw || raw.length === 0) return DEFAULT_PORT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new ConfigError(`Invalid PRISMHUB_PORT "${raw}" — expected integer 1..65535.`);
  }
  return parsed;
}

export function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', ''].includes(normalized)) return false;
  throw new ConfigError(`Invalid boolean env value "${raw}".`);
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export function parseLogLevel(raw: string | undefined): LogLevel {
  if (!raw || raw.length === 0) return 'info';
  const normalized = raw.trim().toLowerCase();
  if ((LOG_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as LogLevel;
  }
  throw new ConfigError(`Invalid PRISMHUB_LOG_LEVEL "${raw}".`);
}

export function parseEnvironment(raw: string | undefined): 'development' | 'production' | 'test' {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (normalized === 'production' || normalized === 'prod') return 'production';
  if (normalized === 'test') return 'test';
  return 'development';
}

const MIN_AUTH_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = 'prismhub-dev-only-insecure-secret-do-not-use-in-production-xxxxxx';

/**
 * Parse the Better Auth secret. In production it must be set and at least
 * {@link MIN_AUTH_SECRET_LENGTH} chars long. In development/test, an insecure
 * deterministic fallback is used so the runtime can boot without ceremony.
 */
export function parseAuthSecret(
  raw: string | undefined,
  environment: 'development' | 'production' | 'test',
): string {
  if (raw && raw.length > 0) {
    if (raw.length < MIN_AUTH_SECRET_LENGTH) {
      throw new ConfigError(
        `BETTER_AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters long.`,
      );
    }
    return raw;
  }
  if (environment === 'production') {
    throw new ConfigError(
      'BETTER_AUTH_SECRET is required in production. Generate one with: openssl rand -base64 32',
    );
  }
  return DEV_FALLBACK_SECRET;
}

export function parseAuthBaseUrl(
  raw: string | undefined,
  fallback: { host: string; port: number },
): string {
  if (raw && raw.length > 0) return raw;
  return `http://${fallback.host}:${fallback.port}`;
}

/** Vite dev-server origins added by default in development/test environments. */
const DEV_FRONTEND_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'] as const;

/**
 * Parse `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated). Always includes the
 * `baseUrl`'s origin so first-party calls work; in non-production environments,
 * also seeds the Vite dev origins so the dashboard at `:5173` can call the
 * API at `:3030` without 403 from Better Auth's CSRF check.
 */
export function parseTrustedOrigins(
  raw: string | undefined,
  environment: 'development' | 'production' | 'test',
  baseUrl: string,
): readonly string[] {
  const origins = new Set<string>();
  origins.add(originOf(baseUrl));
  if (environment !== 'production') {
    for (const o of DEV_FRONTEND_ORIGINS) origins.add(o);
  }
  if (raw && raw.trim().length > 0) {
    for (const part of raw.split(',')) {
      const trimmed = part.trim();
      if (trimmed.length > 0) origins.add(trimmed);
    }
  }
  return Array.from(origins);
}

function originOf(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url;
  }
}
