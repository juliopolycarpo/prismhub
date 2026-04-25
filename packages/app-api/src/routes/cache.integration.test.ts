import { describe, expect, test } from 'bun:test';
import { useAuthedAppApiClient } from './test-helpers.ts';

const getClient = useAuthedAppApiClient();

describe('GET /api/app/cache/stats', () => {
  test('returns placeholder zeros', async () => {
    const client = getClient();
    const res = await client.request('/api/app/cache/stats');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      tokensSavedToday: 0,
      economyToday: 0,
      economyMonth: 0,
      hitRate: 0,
      entriesTotal: 0,
      entriesFresh: 0,
      entriesIdle: 0,
    });
  });

  test('includes X-Prismhub-Placeholder header', async () => {
    const client = getClient();
    const res = await client.request('/api/app/cache/stats');
    expect(res.headers.get('x-prismhub-placeholder')).toBe('true');
  });

  test('returns 401 without auth cookie', async () => {
    const client = getClient();
    const res = await client.requestUnauthed('/api/app/cache/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/app/cache/entries', () => {
  test('returns empty array', async () => {
    const client = getClient();
    const res = await client.request('/api/app/cache/entries');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  test('includes X-Prismhub-Placeholder header', async () => {
    const client = getClient();
    const res = await client.request('/api/app/cache/entries');
    expect(res.headers.get('x-prismhub-placeholder')).toBe('true');
  });
});
