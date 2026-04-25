import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  bootstrapAdminCookie,
  cleanupRuntimeServer,
  shutdownRuntimeServer,
  startRuntimeServer,
  type RuntimeServerHandle,
} from './runtime-server.ts';

const ADMIN = { email: 'admin@prismhub.test', password: 'admin-ratelimit-test-1' };

let runtime: RuntimeServerHandle;

beforeAll(async () => {
  runtime = await startRuntimeServer();
  await bootstrapAdminCookie(runtime.baseUrl, ADMIN);
});

afterAll(async () => {
  await shutdownRuntimeServer(runtime);
  cleanupRuntimeServer(runtime);
});

describe('rate limiter', () => {
  test('5th wrong-pass attempt returns 429', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 5; i += 1) {
      const res = await fetch(`${runtime.baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: ADMIN.email, password: 'definitely-wrong-password-xyz' }),
      });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  }, 30_000);
});
