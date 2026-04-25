import type { ColumnType, Generated } from 'kysely';

export interface MigrationsTable {
  name: string;
  applied_at: string;
}

export interface SettingsTable {
  id: Generated<number>;
  theme_mode: string;
  accent_color: string;
  density: string;
  show_metadata: number;
  allow_user_registration: ColumnType<number, number | undefined, number>;
  updated_at: string;
}

// Better Auth tables — camelCase columns to match the Kysely adapter defaults.

export interface UserTable {
  id: string;
  email: string;
  name: string;
  emailVerified: number;
  image: string | null;
  role: string;
  createdAt: ColumnType<string, string | undefined, string>;
  updatedAt: ColumnType<string, string | undefined, string>;
}

export interface AccountTable {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  password: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  scope: string | null;
  createdAt: ColumnType<string, string | undefined, string>;
  updatedAt: ColumnType<string, string | undefined, string>;
}

export interface AuthSessionTable {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: ColumnType<string, string | undefined, string>;
  updatedAt: ColumnType<string, string | undefined, string>;
}

export interface VerificationTable {
  id: string;
  identifier: string;
  value: string;
  expiresAt: string;
  createdAt: ColumnType<string, string | undefined, string>;
  updatedAt: ColumnType<string, string | undefined, string>;
}

export interface RateLimitTable {
  id: string;
  key: string;
  count: number;
  lastRequest: number;
}

export interface McpServersTable {
  id: string;
  name: string;
  description: string | null;
  transport: string;
  command: string | null;
  args_json: string | null;
  url: string | null;
  headers_json: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface McpToolsTable {
  server_id: string;
  name: string;
  description: string | null;
  input_schema_json: string | null;
  updated_at: string;
}

export interface SessionsTable {
  id: string;
  source: string;
  agent: string;
  title: string | null;
  working_dir: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  tool_call_count: number;
  metadata_json: string | null;
}

export interface SessionEventsTable {
  id: string;
  session_id: string;
  kind: string;
  payload_json: string;
  at: string;
  created_at: ColumnType<string, string | undefined, never>;
}

export interface ToolInvocationsTable {
  id: string;
  session_id: string | null;
  server_id: string | null;
  tool_name: string;
  input_json: string;
  output_json: string | null;
  status: string;
  error: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface AuditEventsTable {
  id: string;
  at: string;
  action: string;
  actor: string;
  target: string;
  details_json: string | null;
}

export interface DatabaseSchema {
  migrations: MigrationsTable;
  settings: SettingsTable;
  mcp_servers: McpServersTable;
  mcp_tools: McpToolsTable;
  sessions: SessionsTable;
  session_events: SessionEventsTable;
  tool_invocations: ToolInvocationsTable;
  audit_events: AuditEventsTable;
  user: UserTable;
  account: AccountTable;
  session: AuthSessionTable;
  verification: VerificationTable;
  rateLimit: RateLimitTable;
}
