import { describe, expect, test } from 'bun:test';
import { jsonInit } from './test-helpers.ts';

describe('jsonInit()', () => {
  test('adds JSON headers and stringifies the body', () => {
    const init = jsonInit('PATCH', { themeMode: 'dark' });

    expect(init).toEqual({
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"themeMode":"dark"}',
    });
  });

  test('omits body when no payload is provided', () => {
    const init = jsonInit('DELETE');

    expect(init).toEqual({
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
    });
  });
});
