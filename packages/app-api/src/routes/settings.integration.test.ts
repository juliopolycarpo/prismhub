import type { SettingsRecord } from '@prismhub/contracts';
import { describe, expect, test } from 'bun:test';
import { jsonInit, useAuthedAppApiClient } from './test-helpers.ts';

const getClient = useAuthedAppApiClient();

describe('GET /api/app/settings', () => {
  test('returns persisted defaults from database seed', async () => {
    const client = getClient();
    const res = await client.request('/api/app/settings');
    expect(res.status).toBe(200);

    const body = (await res.json()) as SettingsRecord;
    expect(body).toEqual({
      themeMode: 'system',
      accentColor: '#F97316',
      density: 'comfortable',
      showMetadata: true,
      allowUserRegistration: false,
    });
  });
});

describe('PATCH /api/app/settings', () => {
  test('applies partial update and persists it', async () => {
    const client = getClient();
    const patchRes = await client.request(
      '/api/app/settings',
      jsonInit('PATCH', {
        themeMode: 'dark',
        accentColor: '#112233',
        density: 'compact',
        showMetadata: false,
      }),
    );
    expect(patchRes.status).toBe(200);

    const patched = (await patchRes.json()) as SettingsRecord;
    expect(patched).toEqual({
      themeMode: 'dark',
      accentColor: '#112233',
      density: 'compact',
      showMetadata: false,
      allowUserRegistration: false,
    });

    const getRes = await client.request('/api/app/settings');
    expect(getRes.status).toBe(200);
    expect((await getRes.json()) as SettingsRecord).toEqual(patched);
  });

  test('rejects invalid accentColor payload', async () => {
    const client = getClient();
    const res = await client.request(
      '/api/app/settings',
      jsonInit('PATCH', { accentColor: 'orange' }),
    );

    expect(res.status).toBe(422);
  });
});

describe('auth gating', () => {
  test('GET /api/app/settings returns 401 without session cookie', async () => {
    const client = getClient();
    const res = await client.requestUnauthed('/api/app/settings');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/app/settings/registration', () => {
  test('admin can toggle allowUserRegistration', async () => {
    const client = getClient();
    const res = await client.request(
      '/api/app/settings/registration',
      jsonInit('PATCH', { enabled: true }),
    );
    expect(res.status).toBe(200);

    const updated = (await res.json()) as SettingsRecord;
    expect(updated.allowUserRegistration).toBe(true);
  });

  test('returns 401 without session cookie', async () => {
    const client = getClient();
    const res = await client.requestUnauthed(
      '/api/app/settings/registration',
      jsonInit('PATCH', { enabled: true }),
    );
    expect(res.status).toBe(401);
  });
});
