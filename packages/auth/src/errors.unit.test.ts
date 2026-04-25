import { describe, expect, test } from 'bun:test';
import { RegistrationDisabledError } from './errors.ts';

describe('RegistrationDisabledError', () => {
  test('exposes a stable code and HTTP status', () => {
    const err = new RegistrationDisabledError();
    expect(err.code).toBe('REGISTRATION_DISABLED');
    expect(err.statusCode).toBe(403);
    expect(err.name).toBe('RegistrationDisabledError');
    expect(err).toBeInstanceOf(Error);
  });

  test('honors a custom message', () => {
    expect(new RegistrationDisabledError('nope').message).toBe('nope');
  });
});
