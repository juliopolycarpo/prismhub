import type { LogLevel } from '@prismhub/config';
import type { LogFields, Logger, LoggerOptions, LogSink } from './log.types.ts';

const LEVEL_WEIGHTS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
} as const satisfies Record<LogLevel, number>;

function levelWeight(level: LogLevel): number {
  return LEVEL_WEIGHTS[level];
}

function shouldLog(active: LogLevel, target: LogLevel): boolean {
  return levelWeight(target) >= levelWeight(active);
}

function stderrSink(line: string): void {
  process.stderr.write(line + '\n');
}

function serializeRecord(
  level: LogLevel,
  serviceName: string | undefined,
  baseFields: LogFields,
  message: string,
  fields: LogFields | undefined,
): string {
  const merged: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(serviceName ? { service: serviceName } : {}),
    ...baseFields,
    ...fields,
  };
  return JSON.stringify(merged);
}

export function createLogger(options: LoggerOptions, sink: LogSink = stderrSink): Logger {
  const { level, serviceName, baseFields = {} } = options;

  const emit = (target: LogLevel, message: string, fields?: LogFields): void => {
    if (!shouldLog(level, target)) return;
    sink(serializeRecord(target, serviceName, baseFields, message, fields));
  };

  return {
    level,
    debug: (message, fields) => emit('debug', message, fields),
    info: (message, fields) => emit('info', message, fields),
    warn: (message, fields) => emit('warn', message, fields),
    error: (message, fields) => emit('error', message, fields),
    child: (bindings) =>
      createLogger({ ...options, baseFields: { ...baseFields, ...bindings } }, sink),
  };
}
