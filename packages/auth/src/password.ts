/**
 * Argon2id password hashing using Bun's native implementation.
 *
 * Bun.password.hash defaults to argon2id and embeds the salt in the PHC
 * output string, so no separate per-user salt column is required.
 */

const ARGON2_OPTS = { algorithm: 'argon2id' as const };

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, ARGON2_OPTS);
}

export async function verifyPassword(args: { password: string; hash: string }): Promise<boolean> {
  return Bun.password.verify(args.password, args.hash);
}
