import type { Migration } from './migration.types.ts';
import { migration0001Init } from './0001_init.ts';
import { migration0002McpHeaders } from './0002_mcp_headers.ts';
import { migration0003BetterAuth } from './0003_better_auth.ts';

export const MIGRATIONS: readonly Migration[] = [
  migration0001Init,
  migration0002McpHeaders,
  migration0003BetterAuth,
];

export type { Migration };
