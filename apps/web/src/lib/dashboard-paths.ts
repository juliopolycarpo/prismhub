export const AUTHENTICATED_PATHS = [
  '/live',
  '/history',
  '/mcps',
  '/local-mcp',
  '/cache',
  '/settings',
] as const;

export type AuthenticatedPath = (typeof AUTHENTICATED_PATHS)[number];

const DEFAULT_AUTHENTICATED_PATH: AuthenticatedPath = '/live';

export function authenticatedPathOrDefault(value: unknown): AuthenticatedPath {
  if (typeof value !== 'string') return DEFAULT_AUTHENTICATED_PATH;
  return isAuthenticatedPath(value) ? value : DEFAULT_AUTHENTICATED_PATH;
}

function isAuthenticatedPath(value: string): value is AuthenticatedPath {
  return (AUTHENTICATED_PATHS as readonly string[]).includes(value);
}
