import { describe, expect, test } from 'bun:test';
import { parseArgv } from './argv';

describe('parseArgv()', () => {
  test('no args returns empty', () => {
    const result = parseArgv([]);
    expect(result.positional).toEqual([]);
    expect(result.flags.size).toBe(0);
    expect(result.options.size).toBe(0);
  });

  test('positional args in order', () => {
    const result = parseArgv(['build', 'packages/core']);
    expect(result.positional).toEqual(['build', 'packages/core']);
  });

  test('--name is boolean flag', () => {
    const result = parseArgv(['--full', '--resume']);
    expect(result.flags.has('full')).toBe(true);
    expect(result.flags.has('resume')).toBe(true);
  });

  test('--name=value is option', () => {
    const result = parseArgv(['--filter=@prismhub/runtime', '--mode=fast']);
    expect(result.options.get('filter')).toBe('@prismhub/runtime');
    expect(result.options.get('mode')).toBe('fast');
  });

  test('mixes positional, flags, options', () => {
    const result = parseArgv(['lint', '--fix', '--scope=core']);
    expect(result.positional).toEqual(['lint']);
    expect(result.flags.has('fix')).toBe(true);
    expect(result.options.get('scope')).toBe('core');
  });

  test('preserves equals in option values', () => {
    const result = parseArgv(['--env=KEY=value']);
    expect(result.options.get('env')).toBe('KEY=value');
  });
});
