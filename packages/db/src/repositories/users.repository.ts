import type { Selectable, Updateable } from 'kysely';
import type { PrismDatabase } from '../client.ts';
import type { UserTable } from '../schema.types.ts';
import { intToBool } from '../sqlite-bool.ts';

export interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly emailVerified: boolean;
  readonly image: string | null;
  readonly role: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function rowToDomain(row: Selectable<UserTable>): UserRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: intToBool(row.emailVerified),
    image: row.image,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function countUsers(db: PrismDatabase): Promise<number> {
  const row = await db
    .selectFrom('user')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();
  return Number(row.count);
}

export async function findUserById(db: PrismDatabase, id: string): Promise<UserRow | null> {
  const row = await db.selectFrom('user').selectAll().where('id', '=', id).executeTakeFirst();
  return row ? rowToDomain(row) : null;
}

export async function findUserByEmail(db: PrismDatabase, email: string): Promise<UserRow | null> {
  const row = await db.selectFrom('user').selectAll().where('email', '=', email).executeTakeFirst();
  return row ? rowToDomain(row) : null;
}

export async function setUserRole(db: PrismDatabase, id: string, role: string): Promise<void> {
  const update: Updateable<UserTable> = {
    role,
    updatedAt: new Date().toISOString(),
  };
  await db.updateTable('user').set(update).where('id', '=', id).execute();
}
