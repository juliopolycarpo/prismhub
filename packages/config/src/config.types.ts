export interface HttpConfig {
  readonly host: string;
  readonly port: number;
  readonly trustNonLocal: boolean;
}

export interface PathsConfig {
  readonly home: string;
  readonly dataDir: string;
  readonly databasePath: string;
  readonly pidfilePath: string;
  readonly logsDir: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggingConfig {
  readonly level: LogLevel;
  readonly stdioSafe: boolean;
}

export interface AuthConfig {
  readonly secret: string;
  readonly baseUrl: string;
  /**
   * Origins allowed to call /api/auth/* endpoints. Better Auth rejects
   * cross-origin requests with 403 unless the request's `Origin` header is
   * listed here. Always include the `baseUrl`'s origin plus any frontend
   * dev origins (e.g. http://localhost:5173 for Vite).
   */
  readonly trustedOrigins: readonly string[];
}

export interface RuntimeConfig {
  readonly env: 'development' | 'production' | 'test';
  readonly http: HttpConfig;
  readonly paths: PathsConfig;
  readonly logging: LoggingConfig;
  readonly auth: AuthConfig;
}
