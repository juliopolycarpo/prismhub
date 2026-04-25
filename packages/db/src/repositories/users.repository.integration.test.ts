import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { type PrismDatabase } from '../index.ts';
import { createTestDatabase } from './test-helpers.ts';
import { countUsers, findUserByEmail, findUserById, setUserRole } from './users.repository.ts';

let db: PrismDatabase;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const test = await createTestDatabase();
  db = test.db;
  cleanup = test.cleanup;
});

afterEach(async () => {
  await cleanup();
});

async function insertUser(id: string, email: string, role = 'user'): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insertInto('user')
    .values({
      id,
      email,
      name: email.split('@')[0] ?? 'user',
      emailVerified: 0,
      image: null,
      role,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
}

describe('countUsers()', () => {
  test('returns 0 on fresh database', async () => {
    expect(await countUsers(db)).toBe(0);
  });

  test('reflects inserted rows', async () => {
    await insertUser('u1', 'a@example.com');
    await insertUser('u2', 'b@example.com');
    expect(await countUsers(db)).toBe(2);
  });
});

describe('findUserById()', () => {
  test('returns null when missing', async () => {
    expect(await findUserById(db, 'missing')).toBeNull();
  });

  test('returns user with mapped fields', async () => {
    await insertUser('u1', 'a@example.com', 'admin');
    const user = await findUserById(db, 'u1');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('a@example.com');
    expect(user?.role).toBe('admin');
    expect(user?.emailVerified).toBe(false);
  });
});

describe('findUserByEmail()', () => {
  test('returns null when missing', async () => {
    expect(await findUserByEmail(db, 'missing@example.com')).toBeNull();
  });

  test('returns user when present', async () => {
    await insertUser('u1', 'found@example.com');
    const user = await findUserByEmail(db, 'found@example.com');
    expect(user?.id).toBe('u1');
  });
});

describe('setUserRole()', () => {
  test('promotes user to admin', async () => {
    await insertUser('u1', 'a@example.com', 'user');
    await setUserRole(db, 'u1', 'admin');
    const user = await findUserById(db, 'u1');
    expect(user?.role).toBe('admin');
  });
});
