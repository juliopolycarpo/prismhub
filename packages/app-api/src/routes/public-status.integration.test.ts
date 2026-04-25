import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  createAppApiTestServices,
  createTestAppApi,
  requestAppApi,
  type AppApiTestServices,
} from './test-helpers.ts';

let services: AppApiTestServices;

beforeEach(async () => {
  services = await createAppApiTestServices();
});

afterEach(async () => {
  await services.cleanup();
});

describe('GET /api/v1/registration-status', () => {
  test('returns firstUser and registrationOpen on fresh DB', async () => {
    const app = createTestAppApi(services);
    const res = await requestAppApi(app, '/api/v1/registration-status');

    expect(res.status).toBe(200);
    const body = (await res.json()) as { firstUser: boolean; registrationOpen: boolean };
    expect(body.firstUser).toBe(true);
    expect(body.registrationOpen).toBe(true);
  });

  test('returns firstUser=false after admin created', async () => {
    await services.auth.api.signUpEmail({
      body: { email: 'admin@prismhub.test', password: 'admin-test-password', name: 'Admin' },
    });

    const app = createTestAppApi(services);
    const res = await requestAppApi(app, '/api/v1/registration-status');

    expect(res.status).toBe(200);
    const body = (await res.json()) as { firstUser: boolean; registrationOpen: boolean };
    expect(body.firstUser).toBe(false);
    expect(body.registrationOpen).toBe(false);
  });

  test('returns registrationOpen=true when admin enables registration', async () => {
    await services.auth.api.signUpEmail({
      body: { email: 'admin@prismhub.test', password: 'admin-test-password', name: 'Admin' },
    });
    await services.settingsService.update({ allowUserRegistration: true });

    const app = createTestAppApi(services);
    const res = await requestAppApi(app, '/api/v1/registration-status');

    expect(res.status).toBe(200);
    const body = (await res.json()) as { firstUser: boolean; registrationOpen: boolean };
    expect(body.firstUser).toBe(false);
    expect(body.registrationOpen).toBe(true);
  });
});
