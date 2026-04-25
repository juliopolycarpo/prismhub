import { describe, expect, test } from 'bun:test';
import { hashPassword, verifyPassword } from './password.ts';

describe('hashPassword()', () => {
  test('produces a different hash each call (salted)', async () => {
    const a = await hashPassword('s3cret-passphrase');
    const b = await hashPassword('s3cret-passphrase');
    expect(a).not.toBe(b);
  });

  test('produces an Argon2id PHC string', async () => {
    const hash = await hashPassword('s3cret-passphrase');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });
});

describe('verifyPassword()', () => {
  test('accepts the original password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword({ password: 'correct-horse', hash })).toBe(true);
  });

  test('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword({ password: 'battery-staple', hash })).toBe(false);
  });
});
