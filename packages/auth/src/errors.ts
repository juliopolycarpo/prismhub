/**
 * Domain error raised by the user-create database hook when a sign-up is
 * rejected because user registration is disabled by the admin setting.
 */
export class RegistrationDisabledError extends Error {
  override readonly name = 'RegistrationDisabledError';
  readonly code = 'REGISTRATION_DISABLED';
  readonly statusCode = 403;

  constructor(message = 'User registration is disabled.') {
    super(message);
  }
}
