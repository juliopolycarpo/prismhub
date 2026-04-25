export { createAuth, type AuthInstance, type AuthSession, type AuthUser } from './auth.ts';
export { authMacros, type AuthMacroContext } from './macro.ts';
export { createAuthPlugin, type AuthPlugin } from './plugin.ts';
export { hashPassword, verifyPassword } from './password.ts';
export { RegistrationDisabledError } from './errors.ts';
export { USER_ROLES, type UserRole, readRole, hasRole } from './roles.ts';
