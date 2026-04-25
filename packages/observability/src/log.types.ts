import type { LogLevel } from '@prismhub/config';

export interface LogFields {
  readonly [key: string]: unknown;
}

export interface Logger {
  readonly level: LogLevel;
  readonly debug: (message: string, fields?: LogFields) => void;
  readonly info: (message: string, fields?: LogFields) => void;
  readonly warn: (message: string, fields?: LogFields) => void;
  readonly error: (message: string, fields?: LogFields) => void;
  readonly child: (bindings: LogFields) => Logger;
}

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly stdioSafe: boolean;
  readonly serviceName?: string;
  readonly baseFields?: LogFields;
}

export type LogSink = (line: string) => void;
