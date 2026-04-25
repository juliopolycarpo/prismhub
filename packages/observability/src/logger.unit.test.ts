import { describe, expect, test } from 'bun:test';
import { createLogger } from './logger.ts';

describe('createLogger', () => {
  test('emits JSON lines at info level', () => {
    const captured: string[] = [];
    const logger = createLogger({ level: 'info', stdioSafe: false, serviceName: 'test' }, (line) =>
      captured.push(line),
    );
    logger.info('hello', { foo: 'bar' });
    expect(captured).toHaveLength(1);
    const firstLine = captured[0];
    if (!firstLine) throw new Error('expected one log line');
    const parsed = JSON.parse(firstLine);
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('hello');
    expect(parsed.foo).toBe('bar');
    expect(parsed.service).toBe('test');
  });

  test('suppresses lower-severity messages', () => {
    const captured: string[] = [];
    const logger = createLogger({ level: 'warn', stdioSafe: true }, (line) => captured.push(line));
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    expect(captured).toHaveLength(2);
  });

  test('child merges base fields', () => {
    const captured: string[] = [];
    const logger = createLogger({ level: 'info', stdioSafe: false }, (line) => captured.push(line));
    logger.child({ requestId: 'abc' }).info('request done');
    const firstLine = captured[0];
    if (!firstLine) throw new Error('expected one log line');
    const parsed = JSON.parse(firstLine);
    expect(parsed.requestId).toBe('abc');
  });
});
