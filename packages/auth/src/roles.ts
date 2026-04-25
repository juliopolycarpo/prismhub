export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function hasRole(value: unknown): value is { role: string } {
  return (
    typeof value === 'object' && value !== null && 'role' in value && typeof value.role === 'string'
  );
}

export function readRole(value: unknown): string | undefined {
  return hasRole(value) ? value.role : undefined;
}
