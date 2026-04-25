import { describe, expect, test } from 'bun:test';
import { useAuthedAppApiClient } from './test-helpers.ts';

const getClient = useAuthedAppApiClient();

describe('GET /api/app/settings', () => {
  test('returns persisted defaults from database seed', async () => {
    const client = getClient();
    const res = await client.request('/api/app/settings');
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      themeMode: string;
      accentColor: string;
      density: string;
      showMetadata: boolean;
      allowUserRegistration: boolean;
    };
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
    const patchRes = await client.request('/api/app/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        themeMode: 'dark',
        accentColor: '#112233',
        density: 'compact',
        showMetadata: false,
      }),
    });
    expect(patchRes.status).toBe(200);

    const patched = (await patchRes.json()) as {
      themeMode: string;
      accentColor: string;
      density: string;
      showMetadata: boolean;
      allowUserRegistration: boolean;
    };
    expect(patched).toEqual({
      themeMode: 'dark',
      accentColor: '#112233',
      density: 'compact',
      showMetadata: false,
      allowUserRegistration: false,
    });

    const getRes = await client.request('/api/app/settings');
    expect(getRes.status).toBe(200);
    expect(
      (await getRes.json()) as {
        themeMode: string;
        accentColor: string;
        density: string;
        showMetadata: boolean;
        allowUserRegistration: boolean;
      },
    ).toEqual(patched);
  });

  test('rejects invalid accentColor payload', async () => {
    const client = getClient();
    const res = await client.request('/api/app/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accentColor: 'orange' }),
    });

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
    const res = await client.request('/api/app/settings/registration', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    });
    expect(res.status).toBe(200);

    const updated = (await res.json()) as {
      themeMode: string;
      accentColor: string;
      density: string;
      showMetadata: boolean;
      allowUserRegistration: boolean;
    };
    expect(updated.allowUserRegistration).toBe(true);
  });

  test('returns 401 without session cookie', async () => {
    const client = getClient();
    const res = await client.requestUnauthed('/api/app/settings/registration', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    });
    expect(res.status).toBe(401);
  });
});
